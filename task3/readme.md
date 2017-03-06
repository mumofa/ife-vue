# 任务目的
了解事件传播机制

# 任务描述
这是“动态数据绑定”的第三题。在第二题的基础上，我们再多考虑一个问题："深层次数据变化如何逐层往上传播"。举个例子。

    let app2 = new Observer({
        name: {
            firstName: 'shaofeng',
            lastName: 'liang'
        },
        age: 25
    });

    app2.$watch('name', function (newName) {
        console.log('我的姓名发生了变化，可能是姓氏变了，也可能是名字变了。')
    });

    app2.data.name.firstName = 'hahaha';
    // 输出：我的姓名发生了变化，可能是姓氏变了，也可能是名字变了。
    app2.data.name.lastName = 'blablabla';
    // 输出：我的姓名发生了变化，可能是姓氏变了，也可能是名字变了。

观察到了吗？`firstName` 和 `lastName` 作为 `name` 的属性，其中任意一个发生变化，都会得出以下结论：`name` 发生了变化。"这种机制符合”事件传播“机制，方向是从底层往上逐层传播到顶层。

这现象想必你们也见过，比如：`点击某一个DOM元素，相当于也其父元素和其所有祖先元素。`（当然，你可以手动禁止事件传播） 所以，这里的本质是："浏览器内部实现了一个事件传播的机制"，你有信心自己实现一个吗？

# 思考
这里面要像浏览器的冒泡一样，子元素发生改变，会向父级传播事件。

那么在递归子类属性的时候就要增加一个变量`path`来记录父级的路径。

    makeObserver(data,paths) {
        let val;
        for(let key in data) {
            //for in出来的属性 会自带原型链上的属性 所以要继续用hasOwnProperty判断是否自身属性
            if( data.hasOwnProperty(key) ) {
                val = data[key];

                let path = "";
                if(!paths) { //没有paths说明是根部，路径直接等于key
                    path = key;
                } else {
                    path = paths + key;
                }

                if(typeof val == "object") {
                    //加上 '.' 为子类路径做准备
                    this.makeObserver(val,path+".");
                }
                this.setProperty(data,key,val,path);
            }
        }
    }

现在`path`已经传递了，那么下一步要做的就是在值变化的时候根据`path`传递通知。

    setProperty(obj,key,val,paths) {
        let _this = this;
        Object.defineProperty(obj,key,{
            enumerable : true,
            configurable : true,
            get : function() {
                return val;
            },
            set : function(newval) {
                if(newval == val) return;

                val = newval;

                //触发 $watch 订阅
                _this.emit(paths);

                if(typeof newval == "object") {
                    //加上 '.' 为子类路径做准备
                    if(paths) {
                        paths = paths+".";
                    }
                    _this.makeObserver(newval,paths);
                }

                console.log(`你设置了${key},新的${key}值为${newval}`);
            }
        });
    }

当值变化的时候，根据`path`传递通知。

    //根据路径发布通知
    emit(path) {
        let keys = path.split(".");
        //可返回父级数组
        /*
        * param path = "a.b.c"
        * return ["a", "a.b", "a.b.c"]
        * */
        let depPaths = keys.map((key, index) => {
           if (index == 0) {
                return key;
            }
            else {
                let str = '';
                while (index--) str = keys[index] + '.' + str;
                return str + key;
            }
        });

        depPaths.forEach((depPath) => {
            let fns = this.events[depPath];
            if(fns) {
                fns.forEach(fn => {
                    fn && fn(this.$getValue(depPath));
                })
            }
        });
    }

    //根据路径获取最后的值
    $getValue(path) {
        path = path.split(".");
        let val = this.data;
        path.forEach(key => {
            val = val[key];
        });
        return val;
    }

[完整代码地址](https://github.com/mumofa/ife-vue/blob/master/task3/observer.js)