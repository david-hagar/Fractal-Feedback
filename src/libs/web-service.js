var SimpleService = Class.create({
    initialize: function(opts) {
        this.opts = jQuery.extend(true, {
            log: true,
            ajaxOpts: {
                type: 'GET',
                dataType: 'json',
                success: function(data) {
                    Logger.log('Successful response from service!');
                    return (jQuery.isEmptyObject(data)) ? false : data;
                },
                statusCode: {
                    403: function() {
                        this.logout();
                    },
                    401: function() {
                        this.logout();
                    }
                },
                error: function() {
                    Logger.log('Service call failed!')
                },
                context: this
            }
        }, opts);
        return this.opts;
    },
    test: function(settings) {
        if (settings.url) {
            var ajaxSettings = jQuery.extend(true, this.opts.ajaxOpts, settings);
            return jQuery.ajax(ajaxSettings);
        } else {
            Logger.log('You did not provide a url for this web service test!');
        }
    },
    logout: function() {
//        localStorage.removeItem('current_user');
//        window.location.href = '/logout';
    }
});

var WebSvcGet = Class.extend(SimpleService, {
    initialize: function(url, data, cb) {
        var _super;
        if (data) {
            var _data = {data: data};
            if (cb) {
                _data = jQuery.extend(true, _data, cb);
            }
            _super = this.parent(_data);
        } else {
            _super = this.parent(cb);
        }
        if (_super) {
            this.jqXHR = this.test(jQuery.extend(true, {url:url}, this.opts));
        }
    }
});
var WebSvcPost = Class.extend(SimpleService, {
    initialize: function(url, data, cb) {
        var _super;
        if (data) {
            var _data = {data: jQuery.toJSON(data)};
            if (cb) {
                _data = jQuery.extend(true, _data, cb);
            }
            _super = this.parent(_data);
        } else {
            _super = this.parent(cb);
        }
        if (_super) {
            this.jqXHR = this.test(jQuery.extend(true, {
                url: url,
                type: 'POST',
                contentType: 'application/json'
            }, this.opts));
        }
    }
});
var WebSvcPut = Class.extend(SimpleService, {
    initialize: function(url, data, cb) {
        var _super;
        if (data) {
            var _data = {data: jQuery.toJSON(data)};
            if (cb) {
                _data = jQuery.extend(true, _data, cb);
            }
            _super = this.parent(_data);
        } else {
            _super = this.parent(cb);
        }
        if (_super) {
            this.jqXHR = this.test(jQuery.extend(true, {
                url: url,
                type: 'PUT',
                contentType: 'application/json'
            }, this.opts));
        }
    }
});
var WebSvcDelete = Class.extend(SimpleService, {
    initialize: function(url, data, cb) {
        var _super;
        if (data) {
            var _data = {data: jQuery.toJSON(data)};
            if (cb) {
                _data = jQuery.extend(true, _data, cb);
            }
            _super = this.parent(_data);
        } else {
            _super = this.parent(cb);
        }
        if (_super) {
            this.jqXHR = this.test(jQuery.extend(true, {
                url: url,
                type: 'DELETE',
                contentType: 'application/json'
            }, this.opts));
        }
    }
});