# Google Salesforce Connector

Salesforce connector library for Dialogflow fulfillment(Node JS)

# Getting Started

Developers can leverage this library by importing it in their projects to do seamless integration with Salesforce instance.

## Pre-requisites

Following is the list of prerequisites required for configuring this library.

>**Node JS** : Node JS is an open-source, cross-platform, JavaScript run time environment.

>**User ID & Password** : User must have a valid user ID and password to log in to the Salesforce application.

>**Security Token** : It is a case-sensitive alphanumeric key that is used along with a username and password to access Salesforce via an API call. This security token is sent along with the user Id, password while making an API call.

The Steps for generating a Security Token are:

**Step 1:** Login to Salesforce Developers Account and navigate to your name at the top right corner of the title bar. Click on it, a drop-down menu appears.

**Step 2:** Click on the My Settings option. The Personal Information screens loads.

**Step 3:** From the left side menu under the My Personal Information section click on the Reset My Security Token option. The Reset Security Token screen appears.

**Step 4:** Now, Click on the Reset Security Token option.

**Step 5:** You will receive the Security Token on your registered Email Id. Store this security token safely on your local machine.

>**Note:** Whenever you change your password you need to change your security token as well.

Refer the image given below for accessing the Reset Security Token option.

**![](https://lh5.googleusercontent.com/oE02J0-_42FdXh1MHCHTqzGLpdn3p39WRPu166H3wFIm5Kz4DMYiSlB1go0W1PeaZbPufTZpT72YyfZcJQMcHrQFx85nPbNjHN0Q2rgIR-ZeG_X0-gkBwselbj4XRbJXqosKwCAa)**

## Installation

In this section, we will cover the installation of the **salesforce-connector** library. For installing **salesforce-connector** as a node dependency in your project, you require a _node package manager_. npm is the default package manager for the Javascript runtime environment Node.js.

For installing the library, open the command line terminal and navigate to your project location.  After this run the following command for installing the library package. Note that the name of the package here is salesforce-connector.

```
npm install https://github.com/GoogleCloudPlatform/dialogflow-integrations.git
```
## Using the client library

To import the library in your Node JS project, run the following command. It invokes the constructor of the Connection class and uses the require method for importing the library modules.

```
'use strict';

const Connection = require('salesforce-connector');

const execute = async () => {
 const conn = new Connection({ logLevel: "INFO" });
 await conn.login({
	 username: "john@demo.com",
	 password: "*******",
	 security_token: "G6oNrdsw***********"
 });
 const queryResult = await conn.query("SELECT ID,NAME from ACCOUNT").run();
 console.log("Result : ", queryResult);
 await conn.logout();
};

execute();
```
   
# Methods

This section walks the user with the procedure to establish a connection and login to the Salesforce CRM application. It also details various queries developed for retrieving and modifying data present in the database.

## Connection
The **Connection** class stores the session information to manage API requests. Given below are the instance members and parameters that belong to Connection class.

**Specifications: Connection Class**

- **Command**

    ```
    new Connection(options: Object?)
    ```

- **Parameters**
<br>options(Object):  Salesforce connection object.

    | **Syntax** | **Description** |
    | --- | --- |
    | options.logLevelString? | Output logging level (DEBUG| INFO| WARN| ERROR| FATAL) |
    | options.versionString? | Salesforce API Version (without &quot;v&quot; prefix) |
    | options.maxRequest Number? | Max number of requests allowed in a parallel call. |
    | options.loginUrlString? | Salesforce Login Server URL (e.g.https://login.salesforce.com/ ) |
    | options.instanceUrlString? | Salesforce Instance URL (e.g. https://na1.salesforce.com/ ) |
    | options.serverUrl String? | Salesforce SOAP service endpoint URL (e.g. https://na1.salesforce.com/services/Soap/u/28.0) |
    | options.sessionId String? | Salesforce session ID. |

    > Default values:
    > -- logLevel: INFO
    > -- version: 42.0
    > -- maxRequest: 10

- **Instances members**:
    - login(options)
    - logout(revoke?)
    - query(soql, options?, callback?)
    - collection(name)

## Login

A user needs to be authenticated for using accessing Salesforce resources. For doing so the user has to provide valid credentials like Username, Password and Security Token.

>**Note:** Steps for generating Security Token, are specified in the Prerequisites section.

Specify the parameters to login into the Salesforce using the following commands:

**Command**
```
let conn = new Connection({ logLevel: "INFO" });
await conn.login({
        username: "john@demo.com",
        password: "*******",
        security_token: "G6oNrdsw***********"
});
```
Authentication is done by accessing salesforce SOAP API and passing username, password and security token to it using the login() method.

**Specifications: login()**

- **Query**

    ```
    login(options: Object): Promise< UserInfo >
    ```

- **Parameters**
<br>options(Object):  Salesforce connection object.

    | **Syntax** | **Description** |
    | --- | --- |
    | options.username String | Salesforce username(and security token, if required) |
    | options.password String | Salesforce password (and security token, if required) |
    | options.security\_token String | Salesforce Security Token. |

- **Returns**

    ```
    Promise< UserInfo > : Returns promise of type UserInfo.
    ```

## Query

We can query the salesforce database the following ways:

### 1. SOQL
SOQL is similar to the SELECT statement in the widely used Structured Query Language (SQL) but is designed specifically for Salesforce data. Using SOQL only fetching of data is possible. Functionalities like Create, Update, Delete etc can be done object Chaining method. SOQL uses query() of connection class.

**Specifications: query()**

- **Query**
    ```
    query(soql: String, options: Object?, callback: Callback<QueryResult>?): Query<QueryResult>
    ```

- **Parameters**
    - soql (String): This is a SOQL string.
    - options (Object?) : This defines query options.

    | **Syntax** | **Description** |
    | --- | --- |
    | Options.headers objects? | Additional HTTP request headers sent in query request |
    | options.responseTarget String | Output of Response target (SingleRecord/Records/Count/QueryResult) |
 
    - callback (Callback< QueryResult >?): Callback function

- **Returns**

    ```
    Query< QueryResult >  :  Returns string.
    ```

 #### 1.1. Run

The **query** method is used to fetch records from the Salesforce database. You can fetch the records by simply mentioning the column name and Table name you wish to extract data from in the SOQL query. An example where the records pertaining to the ID and name section from the Account table are fetched.

**Command**
```
const queryResult = await conn.query('SELECT ID,NAME from ACCOUNT').run();
```
**Specifications: run(options?)**

- **Query**

    ```
    run(options: Object?): Promise<QueryResult>
    ```

- **Parameters**

    options (Object?):This defines query options.
    
    | **Syntax** | **Description** |
    | --- | --- |
    | options.max Fetch Number?  | Max fetching records in auto fetch mode |
    | Options.headers Object? | Additional HTTP request headers sent in query request |

- **Returns**

    ```
    Promise<QueryResult> :  Returns Query Result.
    ```
### 2. Using Chaining Method

Method Chaining is a common technique where each method returns an object and all these methods can be chained together to form a single simple statement. CRUD operations can be performed using Chaining method on Salesforce objects. Additionally, basic SQL conditions like sortBy(), where(), limit(), skip() can be used in Chaining method while the fetching data from the Salesforce database using **collection** method.

**Specifications: collection()**

- **Query**
<br> collection(name: String)

- **Parameters**
<br>name(String): It is the name of the table that is to be queried on.

#### 2.1. Create

User can create a single record in the Salesforce database using by using the **create** method. The create method is used in the following manner.

**Command**
```
const createResult = await conn.collection("Account").create({Name: "Test", Phone: "(415)555-1212", NumberOfEmployees: 50, BillingCity: "San Francisco" });
```
In this command the await operator is  used to wait for the promise to return its result of successful addition of a new record in the Account table present in the Salesforce database.

**Specifications: create()**

- **Query**
    ```
    create(body: Object): Promise<Object>
    ```

- **Parameters**
<br>body (Object): Request payload to sent to the HTTP request.

- **Returns**
<br>Promise: Returns request promise with an instance of the new record created.

#### 2.2. Delete
In order to delete a single record from a specific table present in the database **delete** method is used. The following code snippet shows its implementation.

**Command**
```
const delResult = await conn.collection('Account').delete("0012v00002***");
```
**Specifications: delete()**

- **Query**

    ```
    delete(id: String): Promise<Object>
    ```

- **Parameters**
<br>id (String) :  Id of the record to be deleted.

- **Returns**
<br>Promise:  Returns request promise with no datatype.

#### 2.3. Update

In order to update the data of records present in a specific table in the database **update** method is used. It has been implemented in the following manner.

**Command**
```
const updateResult = await conn.collection('Account').update('0012v00002*****',{
        Name: 'Test Computing New'
        Phone: '(415)555-1212',
        NumberOfEmployees: 50,
        BillingCity: 'San Francisco'
});
```
**Specifications: update()**

- **Query**

    ```
    update(id: String, body: Object): Promise<Object>
    ```

- **Parameters**
    - id (String): Unique ID of the record to be updated
    - body (Object): Request payload JSON object

- **Returns**

    ```
    Promise: Returns request promise with the updated record.
    ```

#### 2.4. Retrieve

##### 2.4.1. Using select

The **select** method is used to retrieve specific field(s) data from the database. Additional methods that can be specified along with select() like sortBy(), limit(), where(), skip().

>**Note:-** Use selectAll() for fetching all the columns present in the database.

**Command :** *Using select()*
```
const select1 = await conn.collection('Account').select(['Id, Name']).run();
```
**Specifications: select()**

- **Query**

    ```
    select(fields: (Object | Array<String> | String)): Query<QueryResult>
    ```

- **Parameters**
<br>fields ((Object | Array< String > | String)): Fields to fetch.
The format can be in a JSON object (MongoDB-like), an array of field names, or comma-separated field names.

- **Returns**

    ```
    Query<QueryResult>: Returns the SOQL query.
    ```

##### 2.4.2. Using selectAll (Promise chaining)

The **selectAll** method fetches the data of all the columns. Additional methods like sortBy(), limit(), where(), skip() can be chained along with this method .

>**Hint:** It has the same functionality as &#39;&#39;  Select \* &#39;&#39; in SQL.

**Command :** *Using selectAll()*

This command can be executed by the following two ways:
<br><br> **i. Using await**
```
//Return Promise  
let selectAllInstance = await conn.collection("Account").selectAll();
//Resolving promise Using await  
let selectALlRes = await selectAllInstance.run();
console.log("Result : ", selectALlRes);
```
**ii. Using .then**
```
//Resolving promise Using .then_
conn.collection("Account").selectAll().then(async (self) => { console.log(await self.run()); });
```
**Specifications: selectAll()**

- **Query**

    ```
    selectAll(): Promise<<Query<QueryResult>>
    ```
- **Returns**
<br> Promise: It returns a Query string.
 
Methods which can be used in the chaining method along with select() and selectAll() method are as follow:

#### 2.5. Sort By
This function when appended to the query sorts the data in the required format. Its implementation along with the select method has been shown below:

**Command**
```
const select2 = await conn.collection("Account").select(["Id, Name"]).sortBy("Name":-1).run();
```
**Specifications:  sortBy()**

- **Query**

    ```
    sortBy(conditions: (Object | String)): Query<QueryResult>
    ```

- **Parameters**
<br>conditions ((Object | String)): Conditions in JSON object or SOQL ORDER BY clause string.

    We can pass an object with the Salesforce field name as key and also &#39;1 or -1&#39; for sorting it in ascending or descending respectively. By default sortBy() sorts in ascending order.

- **Returns**

    ``` 
    Query<QueryResult>: Returns query string.
    ```
#### 2.6. Where
Set query conditions to filter the result records. Its implementation along with the select method has been shown below:

**Command**
```
const select3 = await conn.collection("Account").select(["Id, Name"]).where({$not: {Name: ["GenePoint", "Burlington Textiles Corp of America"]}}).run();
```
**Specifications:  where()**

- **Query**
    ```
    where(conditions: (Object | String)): Query<QueryResult>
    ```
- **Parameters**
<br>conditions ((Object | String)): The results can be fetched using either of the two parameters

    1. Object: JSON Object
    2. String:  Similar to the order by the query in SOQL.

    >**Note:** The data used in the query is requirement specific and should be modified accordingly.  to the format of the object as used in MongoDB.

- **Returns**
    ```
    Query<QueryResult>: Returns query string.
    ```
Following are the conditional keys on the left that can be used in the where() method.
```
"=": =,  
"$eq": =,  
"!=": !=,  
"$ne": !=,  
">": >,  
"$gt": >,  
"<": <,  
"$lt": <,  
">=": >=,  
"$gte": >=,  
"<=": <=,  
"$lte": <=,  
"$like": LIKE,  
"$nlike": NOT LIKE,  
"$in": IN,  
"$nin": NOT IN,  
"$includes": INCLUDES,  
"$excludes": EXCLUDES,  
"$exists": EXISTS,
"$not": NOT,  
"$or": OR,  
"$and": AND
```
#### 2.7. Limit
It restricts the value of the result according to the given parameter (number). Its implementation along with the select method has been shown below:

**Command**
```
const select4 = await conn.collection('Account').select(['Id, Name']).limit(5).run();
```
**Specifications:  limit()**

- **Query**
    ```
    limit(limit: Number): Query<QueryResult>
    ```

- **Parameters**
<br>limit (Number): The maximum number of records the query will return.

- **Returns**
    ```
    Query<QueryResult>: Returns query string
    ```

#### 2.8. Skip
This method is used to skip the defined number of records. When implemented it removes the exact numbers of records as passed as a parameter, starting from the first record.

**Command:**
```
const select5 = await conn.collection('Account').select(['Id, Name']).skip(5).run();
```
This query skips the top five records obtained by filtering the data based on the fields Id and Name from the Accounts table.

**Specifications:  skip()**

- **Query**
    ```
    skip(rows: Number): Query<QueryResult>;
    ```

- **Parameters**
<br>rows ([Number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)): Number of rows to skip from start.

- **Returns**
    ```
    Query<QueryResult>: Returns query string
    ```

The implementation of the sortBy(), limit(), where() and skip() method along with the selectAll() method has been shown below:

 **i. Using await**
```
//Return Promise  
let selectAllInstance = await conn.collection("Account").selectAll();

//Resolving promise Using await  
let selectALlRes = await selectAllInstance.sortBy({"Name":1}).limit(5).skip(4).where({$not: {Name: ["GenePoint", "Burlington Textiles Corp of America"]}}).run();
console.log("Result : ", selectALlRes);
```
**ii. Using .then**
```
//Resolving promise Using .then  
conn.collection("Account").selectAll().then(async (self) => { console.log(await self.sortBy({"Name":1}).limit(5).skip(4).where({$not: {Name: ["GenePoint", "Burlington Textiles Corp of America"]}}).run());});
```

#### 2.9. Upsert

In order to insert the data automatically or update the already existing data in a specific table in the database **upsert** method is used. Incase the user does not pass any id or passes a wrong id, a new record will be created. If the user inputs a correct id the existing record corresponding to this id will be updated. It has been implemented in the following manner.

**Command**
```
const upsertResult = await conn.collection("Account").upsert({  
Id: "0012v012******",  
Name: "Test Computing New",  
Phone: "(415)555-1212",  
NumberOfEmployees: 50,  
BillingCity: "San Francisco"  
});
```

>**Note:** The data used in the query is requirement specific and should be modified accordingly.

**Specifications:  upsert()**

- **Query**
    ```
    upsert(body: Object): Promise
    ```

- **Parameters**
<br>body (Object): Request payload JSON object.

- **Returns**
<br>Promise: Returns request promise.

#### 2.10. Exists

To check whether a record with a specific id exists in the database the **exists** method is used . It has been implemented in the following manner.

**Command**
```
let response = await conn.collection('Account').exists('0012v00002YyU****');
```
**Specifications:  exists()**

- **Query**
    ```
    exists(id: any): Promise<Boolean>
    ```

- **Parameters**
<br>id (any): Unique id of the record.

- **Returns**
<br>Promise (boolean): Returns promise of type boolean.

#### 2.11. Join Table

In order to join two or more tables present in a database,  the **joinTable** method is used. It has been implemented in the following manner.

**Command**
```
const joinResult = await conn.collection("Contact").select(["Id","Name", "AccountId"]).joinTable([{table: "Opportunity", fields: ["Id", "Name", "CloseDate"], condition: "WHERE Opportunity.IsClosed = false ORDER BY Opportunity.CloseDate DESC"}]).populateChild("Account").where({Name: "Jack Rogers"}).run();
```
**Specifications:  joinTable()**

- **Query**

    ```
    joinTable(options: Array<Object>): Query<QueryResult>
    ```

- **Parameters**
<br>options (Array) - The following format must be used:

    ```
    [  
    	{  
    		"table": "Table_Name",  
    		"fields": ["Field1","Field2"]
    		OR
    		"fields": "Field1, Field2"
    	},  
    	"condition": "SOQL String (optional field)"  
    ]
    ```

- **Returns**

    ```
    Query<QueryResult>: Returns query string
    ```

#### 2.12. Populate Child

In order to retrieve the data from the parent table and populate it in the child table **populateChild** method is used. It has been implemented in the following manner.

**Command**
```
const populateChild = await conn.collection('Contact').select('Name').populateChild('Account').run();
```

 Here, Contact is the child table and Account is the parent table.

**Specifications:  populateChild()**

- **Query**

    ```
    populateChild(options: (String | Array)): Query<QueryResult>
    ```

- **Parameters**
<br>options (String | Array): Name of the Parent table to populate.

- **Returns**

    ```
    Query<QueryResult>: Returns query string.
    ```

#### 2.13. Populate Parent

In order to retrieve the data from the child table and populate in the parent table **populateParent** method is used. It can be implemented in the following manner.

**Command**
```
**const populateResult = await conn.collection("Account").select("Account.Name").joinTable([{table: "Contact", fields: ["Name"]}]).populateParent({ child: { table: "Contact", field: "accountId"},parent: {field: "Id"}}).run();**
```

>**Note:** The joinTable method must be used in the code chain before populateParent method.

Specifications:  populateParent()

- **Query**

    ```
    populateParent(conditions: Object): Query<QueryResult>
    ```

- **Parameters**
<br>conditions (Object): Format needs to specified it the following manner

    ```
    {
    	"child": {  
    		"table": "Table_Name",  
    		"field": "Field1"  
    	},  
    	"parent": {  
    		"field": "Field"  
    	}  
    }
    ```

- **Returns**

    ```
    Query<QueryResult>: Returns query string
    ```

## Chatter

The Chatter API allows users to manage their feeds and control how notifications are received. Chatter API methods can be invoked using the chatter method along with the following functions using method chaining.

**Specifications:  chatter()**

- **Query**

    ```
    chatter(): Chatter Instance
    ```

- **Returns**
<br>Creates a chatter instance through connection object and passes the connection configuration to chatter instance.

### 1. Resource

Chatter API resources can be accessed only via the **resource** method. The URL of the endpoint which needs to be accessed is passed as a parameter to the chatter method. The methods like retrieve or create can be chained along with this method.

**Specifications:  resource()**

- **Query**
    ```
    resource(url: String, conditions: Object): Chatter<ChatterResult>
    ```
- **Parameters**

    - url ([String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)): The url of the endpoint to be hit.
    - conditions ([Object](https://developer.salesforce.com/docs/atlas.en-us.chatterapi.meta/chatterapi/connect_returns_filters.htm)?): This defines query parameters (Optional Parameter).

    | **Syntax** | **Description** |
    | --- | --- |
    | conditions.include [Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array) | Fields to be included. When in use cannot use exclude. |
    | conditions.exclude [Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array) | Fields to be excluded. When in use cannot use include. |
    | conditions.filterGroup String | Type of response Body (Big/Medium/Small). |

- **Returns**
    ```
    Chatter<ChatterResult>: Returns access to Chatter resources.
    ```
#### 1.1. Retrieve

In order to retrieve the information of a specified resource, the **retrieve** method is used. It makes an HTTP GET request for the same. It has been implemented in the following manner to get all the feeds.

**Command**
```
const chatterResult = await conn.chatter().resource("feeds/news/me/feed-elements").retrieve();  

chatterResult.elements.forEach(element => { console.log(element.body, element.id, "=="); });  

console.log("result: ", chatterResult, result);  
```

**Specifications:  retrieve()**

- **Query**

    ```
    retrieve(): Promise
    ```

- **Returns**
<br>Promise : Returns promise by retrieving the elements of the feed.

#### 1.2. Create

In order to create a new feed or post for a specified resource, the **create** method can be used. It makes an HTTP POST request for the same.

For example, for posting a comment to a feed can be done in the following manner.

**Command**
```
const result = await conn.chatter().resource("feed-elements/0D52v00*****AF4RCAW/capabilities/comments/items").create({
	"body": {  
		"messageSegments": [{  
			"type": "Text",  
			"text": "Comment for post 2"  
		}]  
	}
});
```
**Specifications:  create()**

- **Query**

    ```
    create(payload:Object): Promise
    ```

- **Parameters**
<br>payload (Object):Request payload to be sent to the API. (Same as mentioned in [Salesforce](https://developer.salesforce.com/docs/atlas.en-us.chatterapi.meta/chatterapi/quickreference.htm))

- **Returns**
<br>Promise : Returns create request promise.

### 2. My Feeds

This method is used to retrieve the feeds of the user in order to retrieve feeds of the currently logged in user for the chatter interface,  the **myFeeds** method is used. It should be used with the **retrieve** method, as it is a GET method.This method has been implemented in the following manner.

**Command**
```
await conn.chatter().myFeeds().retrieve();
```
**Specifications:  myFeeds()**

- **Query**

    ```
    myFeeds(conditions: Object): Object
    ```

- **Parameters**
<br>conditions ([Object](https://developer.salesforce.com/docs/atlas.en-us.chatterapi.meta/chatterapi/connect_returns_filters.htm)?) :  This defines query parameters.

    | **Syntax** | **Description** |
    | --- | --- |
    | conditions.include [Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array) | Fields to be included. When in use cannot use exclude. |
    | conditions.exclude [Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array) | Fields to be excluded. When in use cannot use include. |
    | conditions.filterGroup String | Type of response Body (Big/Medium/Small). |

- **Returns**
<br>Object: Returns an object consisting of logged in user&#39;s feeds details.

### 3. Feeds

In order to retrieve feeds of a specific user, the **feeds** method is used. This method has been implemented in the following manner.

**Command**
```
await conn.chatter().feeds('0052****100eUPATAA4').retrieve();
```
**Specifications:  feeds()**

- **Query:**
feeds(id: String, conditions: Object): any

- **Parameters**

    - id ([String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)): Id of the user&#39;s feed.
    - conditions ([Object](https://developer.salesforce.com/docs/atlas.en-us.chatterapi.meta/chatterapi/connect_returns_filters.htm)?): This defines query parameters. It is an optional Parameter.

    | **Syntax** | **Description** |
    | --- | --- |
    | conditions.include [Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array) | Fields to be included. When in use cannot use exclude. |
    | conditions.exclude [Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array) | Fields to be excluded. When in use cannot use include. |
    | conditions.filterGroup String | Type of response Body (Big/Medium/Small). |

- **Returns**
<br>any: Returns an object consisting of the specific user&#39;s feeds details.

### 4. Profile

In order to retrieve the specific user&#39;s profile, the **profile** method is used. This has been implemented in the following manner.

**Command**
```
const response = await conn.chatter().profile("0052v07***A4").retrieve();
```

**Specifications:  profile()**

- **Query**

    ```
    profile(id: String, conditions: Object): any
    ```

- **Parameters**

    - id ([String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)): Id of the user&#39;s feed.
    - conditions ([Object](https://developer.salesforce.com/docs/atlas.en-us.chatterapi.meta/chatterapi/connect_returns_filters.htm)?) : This defines query parameters Optional Parameter.

    | **Syntax** | **Description** |
    | --- | --- |
    | conditions.include [Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array) | Fields to be included. When in use cannot use exclude. |
    | conditions.exclude [Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array) | Fields to be excluded. When in use cannot use include. |
    | conditions.filterGroup String | Type of response Body (Big/Medium/Small). |

- **Returns**
<br>any: Returns an object consisting of the specific user&#39;s profile details.

## Logout

This functionality ends the user&#39;s current Salesforce session. This makes a SOAP API request. The implementation of the same using the logout method is mentioned below.

**Command**
```
await new Connection({ logLevel: 'INFO' }).logout();
```
**Specifications: logout()**

- **Query**
<br>logout(): Promise

- **Returns**
<br>Promise

## Examples

### Internal Employee - Facing Problem

Sales Rep Requests Deal Support from Solution Engineering Team over Google Assistant using chat.

**Chat based linked** : [https://github.com/GoogleCloudPlatform/dialogflow-integrations/tree/master/salesforce/dialogflow-examples/virtual-agent-internal](https://github.com/GoogleCloudPlatform/dialogflow-integrations/tree/master/salesforce/dialogflow-examples/virtual-agent-internal)

|  |  |
|--|--|
| Bot | Good day! What can I do for you today? |
| User | I would like to make a deal support request. |
| Bot | Right away. Can you mention the customer name? |
| User | Jack |
| Bot | Is this the correct name? <br><br> **Jack Rogers** |
| User | Yes |
| Bot | Please choose any of the following Opportunity or enter case subject name. <br><br> **Dialogflow Retail Opportunity \| 2019-10-25** <br> **Salesforce Retail Opportunity \| 2019-10-17** |
| User | Salesforce Retail Opportunity \| 2019-10-17 |
| Bot | What kind of deal support do you need?<br><br>**Competitive Support <br>       Pricing Support     <br>   Legal Support      <br>  Solution Engineering Support** |
| User | Legal Support |
| Bot | Okay. Any additional notes you would like to add?<br><br>**Yes** <br>**No** |
| User | Yes |
| Bot | Type in your notes. |
| User | Legal Case |
| Bot | Is this deal support request correct?<br><br>Contact Name: Jack Rogers <br>Account Name: Burlington Textiles Corp of America <br>Opportunity Name: Test Opportunity <br>Support Type: Legal Support <br>Notes: Legal Case.<br><br>**Yes   <br>     No** |
| User | Yes |
| Bot | Thank you. Your Case has been created. |

### External B2C Customer- Facing Problem

Customer requesting an update on the status of their case/support ticket over voice. [External B2C Customer- Facing Problem]

**Chat based linked:** [https://github.com/GoogleCloudPlatform/dialogflow-integrations/tree/master/salesforce/dialogflow-examples/virtual-agent-external](https://github.com/GoogleCloudPlatform/dialogflow-integrations/tree/master/salesforce/dialogflow-examples/virtual-agent-external)

|  |  |
|--|--|
| Bot | Good day! What can I do for you today? |
| User | Where is my technician? |
| Bot | What is the phone number associated with your account? |
| User | 4155551212 |
| Bot | Please choose the account<br><br>**Real Solution <br>Beta Computing<br>Alpha Communications<br>Ideal Solution** |
| User | Alpha Communications |
| Bot | Please enter your PIN |
| User | 9999 |
| Bot | Thank you, Have a nice day. Do you want me to try to transfer you to your technician now?<br><br>**Yes  <br>      No**|
| User | Yes |
| Bot | Please stay online while the live agent connects with you. |


## License

Apache Version 2.0