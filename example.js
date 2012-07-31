var osapi = require('./openstack.api.js').api({ server:'10.20.33.238' , port:'5000' , username:'demo' , password:'openstack' , tenant:'demo' });


// Authorize with the OpenStack API Server:
osapi.authorize(function(){

	// Now we are authorized, get security groups:
    osapi.compute.get( '/os-security-groups' , function( result ){
     
     	// Display all Security Groups:
     	console.log(result.security_groups[0]); 
     	
     	// new rule Object:
     	var newRule = {
		    "security_group_rule": {
		        "ip_protocol": "tcp",
		        "from_port": "80",
		        "to_port": "8080",
		        "cidr": "0.0.0.0/0",
		        "parent_group_id": result.security_groups[0].id
		    }
		};
		
		// Create a new Security Rule:
		osapi.compute.post( '/os-security-group-rules' , newRule , function( data ){
			console.log(data);
		});
     	
     });

});