var http        = require('http'),
    querystring = require('querystring'),
    _url 		= require('url');
    

// OSapi   
function OSapi(params){
    
    var self        = this;
    self.url        = params.server || 'localhost';
    self.port       = params.port || '5000';
    self.username   = params.username || 'demo';
    self.password   = params.password || 'openstack';
    self.tenant     = params.tenant || 'demo';
    self.apis       = {};
    self.token      = null;
    self.user 		= {}; 
    
}


// Authorize and get a Token:
// -----------------------------------------------
OSapi.prototype.authorize = function(callback){
    
    var self = this; 
    var req = {
        auth: {
            passwordCredentials : {
                username : self.username,
                password : self.password
            },
            tenantName: self.tenant
        }
    };
    // Setup all API urls:
    self.makeCall({ method:'POST' , url:self.url , port:self.port ,  data:req , path:'/v2.0/tokens' }, function(data){ 
    	
    	// Setup tokens and user:
        self.token = data.access.token;
        self.user = data.access.user;
        
        // Get all endpoints:
        for(var x = 0, l = data.access.serviceCatalog.length; x < l; x++){
            var api = data.access.serviceCatalog[x];
            self.apis[api.type] = api;
            self[api.type] = new self.RESTapi(api.type,self);
        } 
        
        // Callback
        self.cb(callback,data); 
               
    });
    
}


OSapi.prototype.call = function(params,callback){
    
    var self = this;
    self.makeCall(params,function(data){
        self.cb(callback,data);
    });
    
}

OSapi.prototype.RESTapi = function(api,self){ 
	return { 
		parsedUrl : _url.parse(self.apis[api].endpoints[0].adminURL),
		get: function(url,callback){ 
			var s = this;
			var obj = { url:s.parsedUrl.hostname , path:s.parsedUrl.pathname+url , method:'GET', port:s.parsedUrl.port }; 
			self.makeCall(obj,callback);
		},
		post: function(url,data,callback){ 
			var s = this;
			var obj = { url:s.parsedUrl.hostname , path:s.parsedUrl.pathname+url , method:'POST', port:s.parsedUrl.port , data:data }; 
			self.makeCall(obj,callback);
		},
		put: function(url,data,callback){ 
			var s = this;
			var obj = { url:s.parsedUrl.hostname , path:s.parsedUrl.pathname+url , method:'PUT', port:s.parsedUrl.port , data:data }; 
			self.makeCall(obj,callback);
		},
		delete: function(url,callback){ 
			var s = this;
			var obj = { url:s.parsedUrl.hostname , path:s.parsedUrl.pathname+url , method:'DELETE', port:s.parsedUrl.port }; 
			self.makeCall(obj,callback);
		}
	};
}


// Try to callback if possible:
// -----------------------------------------------
OSapi.prototype.cb = function(cb,data){
    if(typeof cb == 'function'){
        cb(data);
    }
}


// Make a API call:
// -----------------------------------------------
OSapi.prototype.makeCall = function(params,callback){
    
    var self = this; 
    
    // Build the post string from an object
    var post_data = JSON.stringify(params.data); 
    
    // An object of options to indicate where to post to
    var post_options = {
        host: params.url,
        port: params.port,
        path: params.path || '/',
        method: params.method || 'POST',
        headers: params.headers || {}
    };
    
    post_options.headers['Content-Type'] = 'application/json';
    
    if(params.method == 'POST' || params.method == 'PUT'){
    	post_options.headers['Content-Length'] = post_data.length;
    }
    
    if(self.token != null){
	    post_options.headers['X-Auth-Token'] = self.token.id;
    }
    
    // Set up the request
    var post_req = http.request(post_options, function(res) {
        res.setEncoding('utf8');
        var chunks = '';
        res.on('data', function (chunk) {
            chunks += chunk;
        });
        res.on('end', function(){ 
            callback(JSON.parse(chunks)); 
        });
    });
    
    // post the data
    if(params.method == 'POST' || params.method == 'PUT'){
    	post_req.write(post_data);
    }
    post_req.end(); 
    
}


// Export this as a module:
// -----------------------------------------------
exports.api = function(params){
    return new OSapi(params);
}