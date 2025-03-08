from flask import Flask, request, jsonify
from flask_cors import CORS 
app = Flask(__name__)
CORS(app)

import google.generativeai as genai

genai.configure(api_key="AIzaSyBKhoXFiVWjdlkF6qmPUluho0z1971_gr0") 


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
    response = genai.GenerativeModel("gemini-2.0-flash").generate_content(content)  # ✅ Correct

    return response.text

def create_questions(interview_id):
    data = get_interview_data(interview_id)
    print("Retrieved Interview Data:", data)  # Debugging output

    # Ensure all values in `data` are strings
    cleaned_data = [d if isinstance(d, str) else "" for d in data]

    return generate_questions(cleaned_data)

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

def add_questions(interview_id):
    add_questions_to_interview(interview_id, [create_questions(interview_id)])

@app.route('/add_questions', methods=['POST'])
def add_questions_api():
    try:
        data = request.json
        interview_id = data.get("interview_id")

        if not interview_id:
            return jsonify({"error": "Missing interview_id"}), 400

        add_questions(interview_id)  # Calls your existing function

        return jsonify({"message": "Questions added successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)