# 任务目的
1. 熟练使用原生 JS对操作 DOM 结构

# 任务描述
这是“动态数据绑定”的第四题。有了前面的充分准备，相信你能搞定这一题。请实现如下的这样一个 Vue，传入参数是一个 `Selector` 和一个数据对象，程序需要将 HTML 模板片段渲染成正确的模样。 这就是一次性的静态数据绑定。

    let app = new Vue({
      el: '#app',
      data: {
        user: {
          name: 'youngwind',
          age: 25
        }
      }
    });

    <!-- 页面中原本的 html 模板片段 -->
    <div id="app">
        <p>姓名：{{user.name}}</p>
        <p>年龄：{{user.age}}</p>
    </div>

    <!-- 最终在页面中渲染出来的结果 -->
    <div id="app">
        <p>姓名：youngwind</p>
        <p>年龄：25</p>
    </div>

# 思考
通过用户传入的选择器获取dom节点。获取节点后我想到有两个方法

1.`innerHTML`正则匹配

    renderView() {
        console.time("redner");
        let htmlString = this.dom.innerHTML;
        let viewArr = htmlString.match(/{{(.*?)}}/g);
        viewArr.forEach((item,index) => {
            let viewData = item.replace(/(\{)|(\})/g,"");
            let val = this.$getValue(viewData);
            htmlString = htmlString.replace(item,val);
        });
        this.dom.innerHTML = htmlString;
        console.timeEnd("redner");
    }

这种是单纯将数据替换，并没有什么可讲

2.循环`dom节点`

    findAllNode(node) {
        console.time("nodeRedner");
        for(let i=0;i<node.children.length;i++) {
            let item = node.children[i];
            if (item.children.length) {
                this.findAllNode(item);
            } else {
                this.compile(item);
            }
        }
        console.timeEnd("nodeRedner");
    }

    compile(node) {
        let viewArr = node.innerText.match(/{{(.*?)}}/g);
        viewArr.forEach((item,index) => {
            let viewData = item.replace(/(\{)|(\})/g,"");
            let val = this.$getValue(viewData);
            node.innerText = node.innerText.replace(item,val);
        });
    }

这种速度比第一种慢很多,但可以构造节点树为下一步可以直接定位修改值

1. [完整代码地址](https://github.com/mumofa/ife-vue/blob/master/task4/vue.js)
2. [预览地址](https://mumofa.github.io/ife-vue/task4/index.html)