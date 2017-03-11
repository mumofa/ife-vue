# 任务目的
1. 综合应用本系列的所有知识点

# 任务描述
这是“动态数据绑定”的最后一题了，希望你能坚持到最后。在第四题的基础上，我们考虑如何做到："当数据发生改变时，重新渲染 `DOM`。

    let app = new Vue({
      el: '#app',
      data: {
        user: {
          name: 'youngwind',
          age: 25
        },
        school: 'bupt',
        major: 'computer'
      }
    });

    <!-- 页面中原本的 html 模板片段 -->
    <div id="app">
        <p>姓名：{{user.name}}</p>
        <p>年龄：{{user.age}}</p>
    </div>

# 思考
这个任务综合性很强，尝试了一番发现自己之前的方法需要抽出几个方法来完成这个任务。

1. 实现一个数据监听器`Observer`，能够对数据对象的所有属性进行监听，如有变动可拿到最新值并通知订阅者。
2. 实现一个指令解析器`Compile`，对每个元素节点的指令进行扫描和解析，根据指令模板替换数据，以及绑定相应的更新函数。
3. 实现一个`Watcher`，作为连接`Observer`和`Compile`的桥梁，能够订阅并收到每个属性变动的通知，执行指令绑定的相应回调函数，从而更新视图。
4. 一个订阅模块`Dep`。

![image](https://sfault-image.b0.upaiyun.com/132/184/132184689-57b310ea1804f_articlex)

# Observer
主要就是前三章的将对象中的数据设置`setter` 、`getter` 而结合本章任务，之前的代码要有小许变化，后面再讲。

# compile(解析过程)

1.解析整个节点

    constructor(el, vm) {
        this.$vm = vm;
        this.$el = this.isElementNode(el) ? el : document.querySelector(el);

        if (this.$el) {
            this.$fragment = this.makeFragment(this.$el);
            this.compileElement(this.$fragment);
            this.$el.appendChild(this.$fragment);
        }
    }

    //将原生节点 copy 到fragment 中
    makeFragment(el) {
        var fragment = document.createDocumentFragment(),
            child;

        // 将原生节点一一拷贝到fragment 最终el会为空
        while (child = el.firstChild) {
            fragment.appendChild(child);
        }

        return fragment;
    }

因为遍历解析的过程有多次操作`dom节点`，为提高性能和效率，会先将跟`节点el`转换成文档碎片`fragment`进行解析编译操作，解析完成，再将`fragment`添加回原来的真实dom节点中。

2.解析单个节点

    compileElement(el) {
        let childNodes = el.childNodes,
            self = this;

        //将节点转成数组 然后遍历
        [].slice.call(childNodes).forEach(function (node) {
            let text = node.textContent;
            let reg = /\{\{(.*)\}\}/;

            //如果还有子节点 继续解析
            if (self.isElementNode(node) && node.childNodes && node.childNodes.length) {
                self.compileElement(node);
            } else if (self.isTextNode(node) && reg.test(text)) {
                self.compileText(node, RegExp.$1);
            }
        });
    }

    //此处文本暂时只对 {{XX.XX}}格式有效 若为 A：{{XX}} 会直接渲染XX
    compileText(node, exp) {
        let val = this.vm.$getValue(exp);

        node.textContent = val;

        //新增观察关系
        new Watcher(this.vm, exp, function (value, oldValue) {
            node.textContent = value;
        });
    }

进行到这里到了文章最重要的一步了，将`view`和`data`建立起关系,我们需要新增订阅者`Watcher`

# Watch

`Watcher`订阅者作为`Observer`和`Compile`之间通信的桥梁，主要做的事情是:
1. 在自身实例化时往属性订阅器(dep)里面添加自己
2. 有一个`Update`方法，等数据改变时，视图也发生改变
3. 当属性`setter`发生改变，会触发待属性变动dep.notice()通知时，能调用自身的update()方法，并触发Compile中绑定的回调，则功成身退。


    class Watcher {
        constructor(vm, exp, callback) {
            this.cb = callback;
            this.vm = vm;
            this.exp = exp;
            this.dependIds = {};
            //触发getVal 建立依赖
            this.value = this.getVal();
        }

        update() {
            var value = this.getVal();
            var oldVal = this.value;
            if (value !== oldVal) {
                this.value = value;
                this.cb.call(this.vm, value, oldVal);
            }
        }

        //增加视图和数据的依赖关系
        addDepend(event) {
            if (!this.dependIds.hasOwnProperty(event.id)) {
                event.addSub(this);
                this.dependIds[event.id] = event;
            }
        }

        getVal() {
            Dep.target = this; // 将当前订阅者指向自己
            let value = this.vm.$getValue(this.exp); // 触发getter，添加自己到属性订阅器中
            Dep.target = null; // 添加完毕，重置
            return value;
        }
    }

这里在创建一个`Watcher`实例，便会执行一次`getVal`，从而触发`getter`，而我们之前提到的改造，便是在这里开始改造。在获取数据前，先将`Dep`对象中的`target`指向`Watcher`本身，从而触发`getter`中的`_dep.depend()`。

    setProperty(obj,key,val,paths) {
        let _this = this;
        let _dep = new Dep();
        Object.defineProperty(obj,key,{
            enumerable : true,
            configurable : true,
            get : function() {

                /*
                * 当视图解析时，如果获取数据时有传入target时
                * 说明这个属性和视图有关系，查看是否已经建立依赖关系
                * */
                if(Dep.target) {
                    _dep.depend();
                }

                return val;
            },
            set : function(newval) {
                if(newval == val) return;

                val = newval;

                //触发 $watch 订阅
                _event.notify();

                if(typeof newval == "object") {
                    //加上 '.' 为子类路径做准备
                    if(paths) {
                        paths = paths+".";
                    }
                    _this.makeObserver(newval,paths);
                }

                //console.log(`你设置了${key},新的${key}值为${newval}`);
            }
        });
    }

# Dep
这个主要是将`Watch`与`Observe`之间建立关系，当对象发生改变，通过实例出的`dep`中的`subs`数组传播事件。类似于一个事件模块。

    let uid = 0;

    var Dep = function() {
        this.id = uid++;
        this.subs = [];
    };

    Dep.prototype = {
        addSub: function(sub) {
            this.subs.push(sub);
        },

        depend: function() {
            Dep.target.addDepend(this);
        },

        removeSub: function(sub) {
            var index = this.subs.indexOf(sub);
            if (index != -1) {
                this.events.splice(index, 1);
            }
        },

        notify: function() {
            this.subs.forEach(function(event) {
                event.update();
            });
        }
    };

    Dep.target = null;

1. [剖析Vue原理&实现双向绑定MVVM](https://segmentfault.com/a/1190000006599500)
2. [vue早期源码学习系列之四：如何实现动态数据绑定](https://github.com/youngwind/blog/issues/87)
3. [完整项目地址](https://github.com/mumofa/ife-vue/blob/master/task5)
4. [预览地址](https://mumofa.github.io/ife-vue/task5/index.html)