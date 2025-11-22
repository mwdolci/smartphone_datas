from flask import Flask, render_template
from flask_socketio import SocketIO, send, emit

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

@app.route('/')
def dashboard():
    return render_template("dashboard.html")

@app.route('/capteurs')
def capteurs():
    return render_template("capteurs.html")

# Message envoyé par téléphone ou PC
@socketio.on("message")
def handle_message(msg):
    print("Message reçu :", msg)
    send(msg, broadcast=True)   # Renvoi à tout le monde

if __name__ == '__main__':
    socketio.run(app, host="0.0.0.0", port=5000)