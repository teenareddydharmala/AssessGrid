from google import genai
client = genai.Client(api_key="AIzaSyBKhoXFiVWjdlkF6qmPUluho0z1971_gr0")

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


print(create_questions("sXk81e"))

