class Vue {
    constructor(option) {
        this.data = option.data;
        this.makeObserver(option.data);

        console.time("redner");
        this.$compile = new Compile(option.el, this);
        console.timeEnd("redner");
    }

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

                //触发订阅
                _dep.notify();

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

    $watch(key,callback) {
        new Watcher(this, key, callback);
    }

    $getValue(path) {
        path = path.split(".");
        let val = this.data;
        path.forEach(key => {
            val = val[key];
        });
        return val;
    }

}