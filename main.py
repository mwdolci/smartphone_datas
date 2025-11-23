from flask import Flask, render_template
from flask_socketio import SocketIO, emit
import datetime

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")  # autorise connexion depuis LAN

@app.route("/")
def dashboard():
    return render_template("home.html")

@app.route("/phone")
def phone():
    return render_template("phone.html")

@socketio.on("sensor")
def handle_sensor(data):
    timestamp = datetime.datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] Reçu :", data)
    emit("sensor", data, broadcast=True)  # renvoie aux clients connectés

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000, debug=True, allow_unsafe_werkzeug=True)
