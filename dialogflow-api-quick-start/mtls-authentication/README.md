## **Mutual TLS authentication with Dialogflow**
Often a secure connection is needed to interact with some fulfillment logic that needs to be encrypted in flight. This guide attempts to show a sample implementation that addresses this need. The GCP products we will use in this sample implementation are [Load Balancer (LB)](https://cloud.google.com/load-balancing) as the front end with optional VM or Cloud Run as backend services. We want to utilize GCP's Load Balancer since it offers the most flexibility for certificate management. We also like the flexibility that comes with using a LB since it allows for us to switch or scale backend services without end user impact. For this example, we will use *nip.io* as our sample domain.   

![arch](images/lb-serverless-run.svg "arch")  


## Deployment Methods

This repo provides [Cloud Build](https://cloud.google.com/cloud-build) yamls for automated deployment. You can also deploy manually if you follow the steps starting with [Allocate IP Section](#Allocate-external-IP). 

### Automated Deployment with Cloud Build
This repo provides a [Cloud Build](https://cloud.google.com/cloud-build) yamls that steps through a deployment process via either [Cloud Run](https://cloud.google.com/run).  
 

#### pre-req
Ensure Cloud Build account has proper permissions to access your project resources. You can step through this [Guide](https://cloud.google.com/cloud-build/docs/quickstart-deploy) for reference.  

Ensure you have the latest GCloud SDK installed on your local machine. You can follow this [Guide](https://cloud.google.com/sdk/docs/install) for reference.  

#### start a build
To kick off a cloud build pipeline, execute the following command:  

```     gcloud builds submit --config build_cloud_run.yml ../```  

the pipeline will deploy the following resources:  
1. Create Docker image from Dockerfile and push to [GCP container registry](https://cloud.google.com/container-registry/)  
2. Deploy cloudrun service from Docker image created from previous step
3. Allocate Static IP for Load Balancer
4. Create GCP managed SSL cert for the <Static IP >.nip.io domain (please change this to your own domain or provide your own certificates)  
5. Create Load Balancer and map app as backend service.   

#### clean up
To clean up, run the following command:  

```     gcloud builds submit --config destroy_cloud_run_based.yml```  


once all the resources are created. open up your browser to https://<External IP>.nip.io to validate. Finally Jump to [DialogFlow set up](#Setup-Dialogflow) to complete. 

### Allocate external IP
We first need to allocate an external IP for this secure communication. In this example, we will need to know the IP address to complete the domain registration for   
```<static_ip>.nip.io```  
navigate to *VPC Network -> External IP addresses* to create a new static external IP address. For this example, we will use a Standard tier IP address that is regional. If you are implementing a solution for production, it's recommended that you use the Premium tier external IP.   
![externalip](images/external_ip.png "external ip")  
Please note the IP address once it has been reserved. We will use the IP address to formulate our domain in this example.   
  
    
### Create a VM

Create a Node JS VM with the following steps:

From the Cloud Console menu select:** Marketplace**

Choose **Node.js by Google Click to deploy image**
 


![alt_text](images/mtls-node-marketplace.png "image_tooltip")




![alt_text](images/mtls-node-deploy.png "image_tooltip")


Select a region. Make sure HTTPS and  HTTPS is checked.

From the Cloud Console menu select:** VPC Network > Firewall > Create new firewall rule**

Targets**: All instances in network**

Source IP ranges**: 0.0.0.0/0**

Specified ports:** tcp > 3000**

Click** Create**




![alt_text](images/mtls-firewall-rule.png "image_tooltip")
  

**Setup your Node application**


```
sudo mkdir /var/www/projects
sudo chown $USER /var/www/projects
cd /var/www/projects

nano index.js
```


Insert the code from the file “index.js”.


```
nano package.json
```


Insert the code from the file “package.json”. 

Install Node packages:


```
npm install
```


Start Node in the background:


```
node index.js &
```

Restart the Apache server:


```
sudo /etc/init.d/apache2 restart
```
  

### Create HTTPS load balancer and attach VM as backend
Navigate to *Network Services -> Load Balancing* to create your new Load Balancer (LB). For this example, we will create a HTTP(s) LB that uses the static [IP](#Allocate-external-IP)  address created previously.   

![alt_text](images/LB.png "lb")  

Give your LB a name, select the [VM](#Create-a-VM) created previously as *Backend Configuration*  

For front end configuration. make sure to change protocol to *HTTPS* and create a Google-managed certificate for domain (<external_ip>.nip.io) for your LB.   

![alt_text](images/front_end_config.png "front end config")  

Once complete, you should see your newly created LB with a green check mark indicating that it's ready to take on traffic.   

![alt_text](images/LB_list.png "front end config")  

  
### Setup Dialogflow

First, make sure that in Dialogflow, you are pointing to your new VM, from the **fulfillments** screen.




![alt_text](images/mtls-dialogflow-webhook.png "image_tooltip")


Second, make sure that in your “Default Welcome Intent” under _Responses_ is empty and _Fulfillment_ is enabled “Enable webhook call for this intent”.  We will call our Webhook to respond to the Welcome Intent.




![alt_text](images/mtls-enable-webhook.png "image_tooltip")


Finally we can test in the “Try it now” section.  Say something like “hello” and see the response from the Node application: **_Welcome to my mTLS secured agent!_**




![alt_text](images/mtls-dialogflow-test.png "image_tooltip")


One final test.  Now that we specified to only allow requests from *.dialogflow.com, back in your browser, try to go directly to the domain and you should get an error message “ERR_BAD_SSL_CLIENT_AUTH_CERT”:




![alt_text](images/mtls-webserver-test.png "image_tooltip")
