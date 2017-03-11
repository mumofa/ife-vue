{
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
}