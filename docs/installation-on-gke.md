# Raw instructions to deploy to GKE

For the sake of the procedure, let's pretend our project has been named "Impulse".

NOTE: The procedure order is important.

1. create an project on GKE

In our case, let's name it "Impulse".

2. Create the PostgreSQL DB

https://console.cloud.google.com/sql/instances?referrer=search&project=impulse-488513

The first password will be for the `postgres`. Store it in 1Password or any other password platform. 

**Create a new user:**

name: `impulse_admin`

Keep the password for later and store it in 1Password or any other password platform. 

**Create a new database:**

name: `impulse`

3. create an service account

https://console.cloud.google.com/iam-admin/serviceaccounts?project=impulse-488513

List of Roles to add:
- `Cloud Run Service Agent`
- `Cloud SQL client`
- `Compute Network User`
- `Compute Network Viewer`
- `Compute Public IP Admin`
- `Secret Mananger Secret Accessor`
- `Vertex AI Service Agent`

4. Create a project in Langfuse

We'll need the secret key later

5. Setup Auth0

- Create a new organization on Auth0

https://manage.auth0.com/dashboard/eu/bayes-impact/organizations
Enable google-oauth2 connections with auto-membership enabled.

Name: `Impulse`

- Create a "Machine to Machine" application

Name: `[PROD] Impulse M2M`

API Permissions: `create:organization_invitations, read:organization_invitations, delete:organization_invitations`

https://manage.auth0.com/dashboard/eu/bayes-impact/applications

- Create a "Single Page Application" application

Name: `[PROD] Impulse`
Login Experience: 
  - Type of Users: `Business Users`

6. Add the secrets

https://console.cloud.google.com/security/secret-manager?project=impulse-488513

Click on "Create secret" to add a new secret.

List of secrets to create:
- `IMPULSE_DATABASE_PASSWORD` (value: the one for the `impulse_admin` created in STEP 2.)
- `IMPULSE_LANGFUSE_SK` (value: the one created in STEP 4.)
- `IMPULSE_AUTH0_M2M_CLIENT_SECRET` (value: the one created in STEP 5.)

7. Create a storage bucket

https://console.cloud.google.com/storage/overview;tab=overview?referrer=search&project=impulse-488513

Click on "Create Bucket"

Name: `eu-connect-file-storage`
Location: eu (multiple regions in European Union) 

Check the "Enforce public access prevention on this bucket" checkbox. 

8. Create a repository for our Docker image

https://console.cloud.google.com/artifacts?referrer=search&project=impulse-488513

Click on "Create Repository"

Name: `impulse`
Region: `europe-west9`

Note: Disable the Vulnerability Scanning

9. Update the Makefile

List of variables to modify:

```bash
imageUrl = europe-west9-docker.pkg.dev/impulse/impulse/api
cloudRunName = impulse
location = europe-west1
zone = europe-west9
langfuseUrl = https://langfuse-y72kzcp7ka-od.a.run.app
langfusePk = pk-lf-7c8dba87-812c-4447-9e6d-80ac06af9311
secretsPrefix = IMPULSE_
postHogHost = https://eu.i.posthog.com
addCloudSqlInstances = impulse-488513:europe-west9:impulse-eu
cloudSqlProxyPort = 5433
auth0OrganizationId = org_CrDgtkMXZORx4H70
auth0Audience = https://bayes-impact.eu.auth0.com/api/v2/
auth0IssuerUrl = https://bayes-impact.eu.auth0.com/
auth0M2MClientId = ct0uygE3ld8IOKjaGozWbRLMae0R0Pcr
auth0ClientId = Ddw6V44kWddjgciJSmYDGV1J0V5w3REB
localStorageServerBaseUrl = https://connect.localhost:3000
gcsStorageBucketName = eu-impulse-file-storage
gcpProjectId = impulse-488513
serviceAccount = impulse-api@impulse-488513.iam.gserviceaccount.com
network = projects/impulse-488513/global/networks/default
databaseUsername = impulse_admin
databaseName = impulse
```

10. Deploy the first version

You need to sign in locally (on your machine) to GKE.


