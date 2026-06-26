from app import create_app
import uvicorn

app=create_app()

if __name__=='__main__':
    uvicorn.run("run:app", host="127.0.0.1", port=5000, reload=True)