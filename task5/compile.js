class Compile {
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

    compileText(node, exp) {
        this._isText(node, this.$vm, exp);
    }

    isElementNode(node) {
        return node.nodeType == 1;
    }

    isTextNode(node) {
        return node.nodeType == 3;
    }

    _isText(node, vm, exp) {
        this._bind(node, vm, exp, 'text');
    }

    _bind(node, vm, exp, dir) {
        let updaterFn = updater[dir + 'Updater'];

        //将{{XX}} 渲染为值
        updaterFn && updaterFn(node, vm.$getValue(exp));

        //新增观察关系
        new Watcher(vm, exp, function (value, oldValue) {
            updaterFn && updaterFn(node, value, oldValue);
        });
    }

}

var updater = {
    textUpdater: function(node, value) {
        node.textContent = typeof value == 'undefined' ? '' : value;
    },

    htmlUpdater: function(node, value) {
        node.innerHTML = typeof value == 'undefined' ? '' : value;
    },

    classUpdater: function(node, value, oldValue) {
        var className = node.className;
        className = className.replace(oldValue, '').replace(/\s$/, '');

        var space = className && String(value) ? ' ' : '';

        node.className = className + space + value;
    },

    modelUpdater: function(node, value, oldValue) {
        node.value = typeof value == 'undefined' ? '' : value;
    }
};

