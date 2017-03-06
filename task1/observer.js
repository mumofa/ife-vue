class Observer {
    constructor(data) {
        this.data = data;
        this.makeObserver(data);
    }

    makeObserver(data) {
        let val;
        for(let key in data) {
            //for in出来的属性 会自带原型链上的属性 所以要继续用hasOwnProperty判断是否自身属性
            if( data.hasOwnProperty(key) ) {
                val = data[key];

                if(typeof val == "object") {
                    this.makeObserver(val);
                }
                this.setProperty(data,key,val);
            }
        }
    }

    setProperty(obj,key,val) {
        let _this = this;
        Object.defineProperty(obj,key,{
            enumerable : true,
            configurable : true,
            get : function() {
                console.log(`你访问了${key}`);
                return val;
            },
            set : function(newval) {
                if(newval == val) return;

                val = newval;

                console.log(`你设置了${key},新的${key}值为${newval}`);
            }
        });
    }

}