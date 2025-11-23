# smartphone_datas

## 🛠️ Mise en place de Flask en HTTPS (tests sur smartphone)

## 1. Générer un certificat auto‑signé

Ouvrir un terminal et exécuter :

```bash
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
```

Répondre aux questions (nom de domaine, organisation, etc.).

Cela crée deux fichiers :

key.pem → clé privée

cert.pem → certificat auto‑signé

👉 Pour les tests en local, un certificat auto‑signé suffit. Sur un vrai déploiement, il faudra un certificat valide (ex. Let’s Encrypt).

## 2. Modifier le serveur Flask
Dans ton main.py, ajouter le paramètre SSL :

```python
from flask import Flask

app = Flask(__name__)

@app.route('/')
def index():
    return "Hello, HTTPS Flask!"

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, ssl_context=("cert.pem", "key.pem"))
```

## 3. Accéder depuis le smartphone

Ouvrir l’URL :

```Code
https://<IP_du_PC>:5000
```

⚠️ Le navigateur du smartphone affichera probablement un avertissement de sécurité (car certificat auto‑signé).

Accepter l’exception pour continuer.

Une fois en HTTPS, le navigateur devrait autoriser l’accès aux capteurs et la communication Socket.IO avec Flask.

## 4. Vérifications côté réseau

S’assurer que le port 5000 est ouvert dans le pare‑feu.

Vérifier que python.exe et pythonw.exe dans .venv ont bien les droits d’accès réseau.

Tester la connexion avec :

```bash
curl -k https://<IP_du_PC>:5000
```
