
class Watcher {
    constructor(vm, exp, callback) {
        this.cb = callback;
        this.vm = vm;
        this.exp = exp;
        this.dependIds = {};
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
    addDepend(dep) {
        if (!this.dependIds.hasOwnProperty(dep.id)) {
            dep.addSub(this);
            this.dependIds[dep.id] = dep;
        }
    }

    getVal() {
        Dep.target = this; // 将当前订阅者指向自己
        let value = this.vm.$getValue(this.exp); // 触发getter，添加自己到属性订阅器中
        Dep.target = null; // 添加完毕，重置
        return value;
    }
}