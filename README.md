# 🖥️ SmartCockpit

## 👥 Auteurs
**Dolci Marco**  
**Debons Christophe**  
**Akram Ayman** 
  
*Les contributions externes sont les bienvenues via Pull Request.*

## 🧾 Description

**SmartCockpit** est un projet permettant d’afficher en temps réel les données issues des capteurs d’un smartphone Android directement sur une interface web.  
Il agit comme un cockpit complet regroupant les informations suivantes :

📌 Orientation 2D/3D • Coordonnées GPS • Boussole • Etat de la batterie • Microphone • Caméra • Réseau • Heure locale • et plus encore.

L’objectif est d’offrir un tableau de bord clair et réactif pour visualiser facilement l’état d’un smartphone en direct.

---

## 🚀 Utilisation

### 📱 Sur le smartphone Android (source des données)

1. Ouvrez la page :  
   👉 **https://mwdolci.github.io/smartphone_datas/**
2. Activez les capteurs que vous souhaitez transmettre.

### 🖥️ Sur le PC (cockpit)

1. Ouvrez la page **`cockpit.html`** avec live server
2. Observez en temps réel les données envoyées par le smartphone.

Aucune installation nécessaire. L’application communique via un WebSocket avec un serveur Node.js hébergé sur Render.com.

---

## 🎯 Contribution

Les contributions sont les bienvenues ! Si vous souhaitez corriger un bug, améliorer une fonctionnalité ou proposer une nouvelle idée :

1. Forkez ce dépôt
2. Créez une branche (`git checkout -b feature/nom-fonction`)
3. Commitez vos modifications (`git commit -m 'Ajout d'une fonctionnalité'`)
4. Poussez vers votre fork (`git push origin feature/nom-fonction`)
5. Ouvrez une Pull Request

Merci d'avance pour votre aide ! 🙌

## 📄 Licence

Ce projet est sous licence [MIT](./LICENSE).  
Vous pouvez l’utiliser, le modifier et le redistribuer librement, à condition de conserver les mentions d’auteurs.