class Observer {
    constructor(data,parent) {
        this.data = data;
        this.makeObserver(data,parent);
        this.events = {};

    }

    makeObserver(data,paths) {
        let val;
        for(let key in data) {
            //for in出来的属性 会自带原型链上的属性 所以要继续用hasOwnProperty判断是否自身属性
            if( data.hasOwnProperty(key) ) {
                val = data[key];

                let path = "";
                if(!paths) {
                    path = key;
                } else {
                    path = paths + key;
                }
                //if (!path) path = key;
                //else path = path + key;

                if(typeof val == "object") {
                    //new Observer(val,parent);
                    if(path) {
                        path += ".";
                    }
                    this.makeObserver(val,path);
                }

                this.setProperty(data,key,val,path);
            }
        }
    }

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
                _this.$notify(paths);

                if(typeof newval == "object") {
                    if(paths) {
                        paths = paths+".";
                    }
                    _this.makeObserver(newval,paths);
                }

                console.log(`你设置了${key},新的${key}值为${newval}`);
            }
        });
    }

    $watch(key,callback) {
        if (!this.events[key]) {
            this.events[key] = [];
        }
        this.events[key].push(callback);
    }

    //给深层属性往父级注册事件
    $notify(path) {
        let keys = path.split(".");
        //可返回父级数组
        /*
        * param path = "a.b.c"
        * return ["a", "a.b", "a.b.c"]
        * */
        let depPaths = keys.map((key, index) => {
            if (index == 0) return key
            else {
                let str = '';
                while (index--) str = keys[index] + '.' + str
                return str + key
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

    $getValue(path) {
        path = path.split(".");
        let val = this.data;
        path.forEach(key => {
            val = val[key];
        });
        return val;
    }

}