
from google import genai
client = genai.Client(api_key="AIzaSyBKhoXFiVWjdlkF6qmPUluho0z1971_gr0")

import random
import string

import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate("../firebase/access-grid-firebase-adminsdk-fbsvc-3c8a09df65.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

def get_file_data(file_id):
    file_ref = db.collection("files").document(file_id).get()
    return file_ref.to_dict().get("data", "") if file_ref.exists else ""


def get_files_ids(interview_id):
    interview_ref = db.collection("interviews").document(interview_id).get()
    if not interview_ref.exists:
        print(f"No interview found with ID: {interview_id}")
        return []
    interview_data = interview_ref.to_dict()
    return interview_data.get("files", [])

def get_interview_data(interview_id):
    files = get_files_ids(interview_id)
    return [get_file_data(file_id) for file_id in files]


def generate_questions(data):
    content = "You are an expert interviewer. Your task is to generate 5 to 6 high-quality interview questions on the following topic. The questions should be insightful, clear, and suitable for an interview setting.  Requirements: - Generate exactly 5 to 6 questions. Each question should be well-formed and grammatically correct. Questions should assess the candidate's understanding, problem-solving, and practical knowledge of the topic. Output each question on a separate line. Keep the questions short. Generate the questions now.\n" + "\n".join(data)
    response = client.models.generate_content(
       model="gemini-2.0-flash", contents=content
    )
    return response.text

def create_questions(interview_id):
    return generate_questions(get_interview_data(interview_id))


def generate_unique_key(length=6):
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

def add_question(question):
    ques_id = generate_unique_key()
    db.collection("questions").document(ques_id).set({
        "question": question,
        "answer": None
    })
    return ques_id

def add_questions_to_interview(interview_id, questions):
    interview_ref = db.collection("interviews").document(interview_id)
    if not interview_ref.get().exists:
        print(f"Interview with ID {interview_id} not found.")
    
    ques_ids =[]
    for question in questions:
        interview_ref.update({
            "questions": firestore.ArrayUnion([add_question(question)])
        })

   
interview_id = "wnwvLn"
questions = [
    "What are the key differences between Python and Java?",
    "Explain the concept of recursion with an example.",
    "What is a database index, and why is it useful?",
    "Describe the working of the OSI model in networking.",
    "What are the advantages of using Firebase Firestore?"
]

add_questions_to_interview(interview_id, questions)


