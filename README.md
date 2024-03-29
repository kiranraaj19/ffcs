# FFCS API

The source code given is for cross checking the logic and legality of the api code. It cant be locally tested without the Database credentials, which are supposed to be protected in a .env file. If hiring managers require to test the repo locally on their machine, they can contact me by opening an issue.

# Testing

## AWS Server IP

```bash
18.221.133.215:3000 (Elastic IP has been removed because of incurred costs)
```

## Admin AUTH Token:

```bash
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MCwibmFtZSI6ImFkbWluIiwiaWF0IjoxNjc3ODY3OTYxfQ.6pWUFGFJzWjdITpj4MQZemmp2C8t1qhHTJVBQmQSW6I
```

This contains the info:
{
    id: 0,
    name: "admin"
}

which can be used to access routes only meant for admin (/admin/slot, /admin/faculty, /admin/student, /admin/course)

## Student AUTH Token:
```bash
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6IktpcmFucmFhaiIsImlhdCI6MTY3Nzg2ODA0Nn0.v16b2uwIGh5FIBGyfYj9wV3Hin7V5YEy2Bgqnkm6mAc
```

This contains the info:
{
    id: 1,
    name: "Kiranraaj"
}

which can be used by access routes meant for the particular student. This way a student cant access other students info as they dont know other students Access token. Thanks to Json Web Tokens, They will only be able to get their token

# Logic for checking auth tokens

![Screenshot from 2023-03-03 23-00-52](https://user-images.githubusercontent.com/39441413/222897176-62b75b4d-86b0-4de5-a293-b2181b7d2a89.png)

# ER Diagram for the schemas

![image](https://user-images.githubusercontent.com/39441413/222961230-771653ad-fe52-4ec7-8c50-51dae7a54b2a.png)


## Endpoints to check contents of Tables

### Courses (http://18.221.133.215:3000/courses)
### Slots (http://18.221.133.215:3000/slots)
### Faculties (http://18.221.133.215:3000/faculties)

# API Routes available

## Admin Routes

## /admin/faculty

This is used to create faculties

```bash
curl --request POST \
  --url http://18.221.133.215:3000/admin/faculty \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MCwibmFtZSI6ImFkbWluIiwiaWF0IjoxNjc3ODY3OTYxfQ.6pWUFGFJzWjdITpj4MQZemmp2C8t1qhHTJVBQmQSW6I' \
  --header 'Content-Type: application/json' \
  --data '{
  "id": "4",
  "name": "Prof. Nachiyappan"
}'
```

### Possible Responses
- 401 Forbidden Req (Make sure you are an admin or using admin token)
- 500 Server error (Server Might be down or Faculty already exists)
- 201 Ok Status code e.g {"success":true,"data":{"id":"4","name":"Prof. Nachiyappan"}

## /admin/course

This is used to create courses

```bash
curl --request POST \
  --url http://18.221.133.215:3000/admin/course \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MCwibmFtZSI6ImFkbWluIiwiaWF0IjoxNjc3ODY3OTYxfQ.6pWUFGFJzWjdITpj4MQZemmp2C8t1qhHTJVBQmQSW6I' \
  --header 'Content-Type: application/json' \
  --data '{
  "id": "2",
  "name": "CSE3502",
  "slot_ids": [
    "G1"
  ],
  "faculty_ids": [
    "4"
  ],
  "course_type": "THEORY"
}'
```

### Possible Responses

- 401 Forbidden Req (Make sure you are an admin or using admin token)
- 405 Invalid Slot (Make sure Slot already exists)
- 500 Server error (Server Might be down)
- 201 Ok Status code e.g {"success":true,"data":{"id":"2","name":"CSE3502","faculties":[{"id":"4","name":"Prof. Nachiyappan"}],"allowed_slots":[]}}

## /admin/student

This is used to create students

```bash
curl --request POST \
  --url http://18.221.133.215:3000/admin/student \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MCwibmFtZSI6ImFkbWluIiwiaWF0IjoxNjc3ODY3OTYxfQ.6pWUFGFJzWjdITpj4MQZemmp2C8t1qhHTJVBQmQSW6I' \
  --header 'Content-Type: application/json' \
  --data '{"id": "2", "name": "test"}'
```

### Possible Responses

- 401 Forbidden Req (Make sure you are an admin or using admin token)
- 500 Server error (Server Might be down)
- 201 Ok Status code e.g {"success":true,"data":{"id":"2","name":"test"}}

## /admin/slot

This is used to create slots

```bash
curl --request POST \
  --url http://18.221.133.215:3000/admin/slot \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MCwibmFtZSI6ImFkbWluIiwiaWF0IjoxNjc3ODY3OTYxfQ.6pWUFGFJzWjdITpj4MQZemmp2C8t1qhHTJVBQmQSW6I' \
  --header 'Content-Type: application/json' \
  --data '{
  "id": "C1",
  "timings": [
    {
      "day": "WED",
      "start": "2019-10-24T14:15:22Z",
      "end": "2019-10-24T14:15:22Z"
    }
  ]
}'
```

### Possible Responses

- 401 Forbidden Req (Make sure you are an admin or using admin token)
- 500 Server error (Server Might be down or Slot already exists)
- 201 Ok Status code e.g {"success":true,"data":{"id":"2","name":"test"}}


## Public Routes

## /faculty/:faculty_id

This is used to access faculty information

```bash
curl --request GET \
  --url http://18.221.133.215:3000/faculty/1 \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6IktpcmFucmFhaiIsImlhdCI6MTY3Nzg2ODA0Nn0.v16b2uwIGh5FIBGyfYj9wV3Hin7V5YEy2Bgqnkm6mAc' \
  --header 'Content-Type: application/json'
```

### Possible Responses

- 401 Forbidden Req (Make sure you are an admin or using admin token)
- 500 Server error (Server Might be down)
- 201 Ok Status code e.g {"success":true,"data":[{"id":"1","name":"Nayeem Khan Sir"}]

## /course/:course_id

This is used to access faculty information

```bash
curl --request GET \
  --url http://18.221.133.215:3000/course/1 \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6IktpcmFucmFhaiIsImlhdCI6MTY3Nzg2ODA0Nn0.v16b2uwIGh5FIBGyfYj9wV3Hin7V5YEy2Bgqnkm6mAc' \
  --header 'Content-Type: application/json'
```

### Possible Responses

- 401 Forbidden Req (Make sure you are an admin or using admin token)
- 500 Server error (Server Might be down)
- 201 Ok Status code e.g {"success":true,"data":{"id":"1","name":"CSE","slot_ids":["A1"],"faculty_ids":["1"],"course_type":"THEORY"}}


## /register

Student should be able to register

```bash
curl --request POST \
  --url http://18.221.133.215:3000/register \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6IktpcmFucmFhaiIsImlhdCI6MTY3Nzg2ODA0Nn0.v16b2uwIGh5FIBGyfYj9wV3Hin7V5YEy2Bgqnkm6mAc' \
  --header 'Content-Type: application/json' \
  --data '{
  "course_id": "2",
  "faculty_id": "4",
  "slot_ids": [
    "G1"
  ]
}'
```

### Possible Responses

- 401 Forbidden Req (Make sure you using valid token)
- 405 Slots clash
- 500 Server error (Server Might be down)
- 201 Ok Status code 

## /timetable

Student should be able to see (only) his timetable

```bash
curl --request GET \
  --url http://18.221.133.215:3000/timetable \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6IktpcmFucmFhaiIsImlhdCI6MTY3Nzg2ODA0Nn0.v16b2uwIGh5FIBGyfYj9wV3Hin7V5YEy2Bgqnkm6mAc' \
  --header 'Content-Type: application/json'
```

### Possible Responses

- 401 Forbidden Req (Make sure you are using valid token)
- 500 Server error (Server Might be down)
- 201 Ok Status code 

## Generated Data using API (Can also be used for testing)

## Faculties

![image](https://user-images.githubusercontent.com/39441413/222921330-919c4137-483b-43ec-9bb7-c4144f243832.png)

## Slots

![image](https://user-images.githubusercontent.com/39441413/222922099-197d7efe-6d9b-4d37-ab4d-3eca3591dc63.png)

## Courses

![image](https://user-images.githubusercontent.com/39441413/222922209-0f06a598-67b7-47dc-9bd0-689b70902710.png)

## Students

![image](https://user-images.githubusercontent.com/39441413/222922340-05d9f1ee-c1be-4bb0-be1e-d0791ec036e9.png)


## Testing with API

- Use the admin auth token to create a particular slot
- Register a faculty as admin
- Create a course with generated slot and admin. (If error occurs, check that you didnt create an entry with duplicate primary key)
- As a public user, you can view faculty information and course information
- As a student, use the given student auth token (The given token is of Student id. 1), Register for avaialable courses

