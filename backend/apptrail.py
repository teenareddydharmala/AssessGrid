import firebase_admin
from firebase_admin import credentials, firestore
from sentence_transformers import SentenceTransformer, util
from transformers import pipeline
import speech_recognition as sr
import json

# Initialize Firebase
cred = credentials.Certificate("path/to/firebase-credentials.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

# Load NLP models
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
question_generator = pipeline("text2text-generation", model="valhalla/t5-base-qg-hl")

# Step 1: Fetch the latest interview for the user
def get_latest_interview(user_id):
    user_ref = db.collection('users').document(user_id)
    user_data = user_ref.get().to_dict()
    return user_data.get("last_interview_id") if user_data else None

# Step 2: Fetch study material from files linked to the interview
def get_study_text(interview_id):
    interview_ref = db.collection('interviews').document(interview_id)
    interview_data = interview_ref.get().to_dict()
    file_ids = interview_data.get('files', [])
    all_text = ""
    
    for file_id in file_ids:
        file_ref = db.collection('files').document(file_id)
        file_data = file_ref.get().to_dict()
        if file_data and 'data' in file_data:
            all_text += file_data['data'] + "\n\n"
    
    return all_text if all_text else None

# Step 3: Generate questions from study material
def generate_questions(study_text, num_questions=6):
    formatted_text = "highlight: " + study_text + " </s>"
    results = question_generator(formatted_text, max_length=128, num_return_sequences=num_questions)
    return [res['generated_text'] for res in results]

# Step 4: Store generated questions in Firestore
def store_questions(interview_id, questions):
    question_ids = []
    for question in questions:
        question_ref = db.collection('questions').add({
            "question": question,
            "answer": ""
        })
        question_ids.append(question_ref[1].id)
    
    db.collection('interviews').document(interview_id).update({"questions": question_ids})
    return question_ids

# Step 5: Capture user answer and store it
def listen_and_transcribe():
    recognizer = sr.Recognizer()
    with sr.Microphone() as source:
        recognizer.adjust_for_ambient_noise(source)
        audio = recognizer.listen(source)
    
    try:
        return recognizer.recognize_google(audio)
    except sr.UnknownValueError:
        return "Could not understand audio"
    except sr.RequestError:
        return "Error in request"

def store_answer(question_id, answer):
    db.collection('questions').document(question_id).update({"answer": answer})

# Step 6: Analyze answers and store results
def analyze_answers(interview_id):
    interview_ref = db.collection('interviews').document(interview_id)
    interview_data = interview_ref.get().to_dict()
    question_ids = interview_data.get('questions', [])
    
    total_score = 0
    weak_topics, strong_topics = [], []
    
    for question_id in question_ids:
        question_ref = db.collection('questions').document(question_id)
        question_data = question_ref.get().to_dict()
        
        if question_data and 'answer' in question_data:
            answer = question_data['answer']
            study_text = get_study_text(interview_id)
            answer_embedding = embedding_model.encode(answer, convert_to_tensor=True)
            study_embedding = embedding_model.encode(study_text, convert_to_tensor=True)
            similarity = util.pytorch_cos_sim(answer_embedding, study_embedding).item()
            score = round(similarity * 10, 2)
            total_score += score
            
            if score < 5:
                weak_topics.append(question_data['question'])
            else:
                strong_topics.append(question_data['question'])
    
    avg_score = round(total_score / len(question_ids), 2)
    
    db.collection('results').document(interview_id).set({
        "score": avg_score,
        "weak_topics": weak_topics,
        "strong_topics": strong_topics
    })

# Step 7: Display results to the user
def get_results(interview_id):
    result_ref = db.collection('results').document(interview_id)
    result_data = result_ref.get().to_dict()
    return result_data
