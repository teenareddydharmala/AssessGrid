from google import genai

client = genai.Client(api_key="AIzaSyBKhoXFiVWjdlkF6qmPUluho0z1971_gr0")
response = client.models.generate_content(
    model="gemini-2.0-flash", contents="Explain how AI works"
)
print(response.text)