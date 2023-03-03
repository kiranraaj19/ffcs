Admin AUTH Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MCwibmFtZSI6ImFkbWluIiwiaWF0IjoxNjc3ODY3OTYxfQ.6pWUFGFJzWjdITpj4MQZemmp2C8t1qhHTJVBQmQSW6I

This contains the info:
{
    id: 0,
    name: "admin"
}

which can be used to access routes only meant for admin

Student AUTH Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6IktpcmFucmFhaiIsImlhdCI6MTY3Nzg2ODA0Nn0.v16b2uwIGh5FIBGyfYj9wV3Hin7V5YEy2Bgqnkm6mAc

This contains the info:
{
    id: 1,
    name: "Kiranraaj"
}

which can be used by access routes meant for the particular student. This way a student cant access other students info as they dont know other students Access token. Thanks to Json Web Tokens, They will only be able to get their token