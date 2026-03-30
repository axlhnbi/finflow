# FinFlow 📊

FinFlow is a modern mobile application for personal financial management, designed with an intuitive interface and responsive performance. This app helps users easily track their daily cash flow, monitor expenses, and manage their finances efficiently right from their fingertips.

---

## 🚀 Key Features

* **Transaction Tracking:** Quickly and easily record daily income and expenses.
* **Data Visualization:** Monitor your cash flow through interactive charts and statistical reports.
* **Smart Categorization:** Group transactions by category for more precise and detailed expense analysis.

---

## 🛠️ Tech Stack

This application is built using a modern hybrid technology ecosystem:

* **Core Framework:** [Ionic Framework](https://ionicframework.com/)
* **Native Runtime:** [Capacitor](https://capacitorjs.com/) (for seamless integration with native Android features)
* **Styling:** CSS / SCSS utilizing built-in Ionic UI components

---

## 📸 Screenshots

*(Replace the placeholder image links below with the actual screenshots of the FinFlow app)*

| Home Screen | Add Transaction | Financial Reports |
| :---: | :---: | :---: |
| <img src="https://via.placeholder.com/250x500.png?text=Home+Screen" width="200"> | <img src="https://via.placeholder.com/250x500.png?text=Transaction" width="200"> | <img src="https://via.placeholder.com/250x500.png?text=Reports" width="200"> |

---

## 🏃‍♂️ How to Run & Build

Follow these instructions to set up, run, and build the project on your local machine. 

### Prerequisites
Make sure you have the following installed:
* [Node.js](https://nodejs.org/) (LTS version recommended)
* [Ionic CLI](https://ionicframework.com/docs/cli) (`npm install -g @ionic/cli`)
* [Android Studio](https://developer.android.com/studio) (for Android compilation and emulation)

### 1. Initial Setup
Clone the repository and install the necessary dependencies:
```bash
git clone [https://github.com/axlhnbi/finflow.git](https://github.com/axlhnbi/finflow.git)
cd finflow
npm install
```

### 2. Run in Browser (Web Development)
For quick UI adjustments and web-based testing with live reload:
```bash
ionic serve
```

### 3. Run on Android (Emulator / Physical Device)
To test the native capabilities of the application on Android:
# Build the web assets
```bash
ionic build
```
# Sync the Capacitor Android project
```bash
npx cap sync android
```
# Open the project in Android Studio to run or build
```bash
npx cap open android
```

### 4. Build for Production (Play Store Release)
To generate the final AAB (Android App Bundle) or APK file for distribution:
```bash
ionic build --prod
npx cap sync android
```

After syncing, open Android Studio (npx cap open android), navigate to Build > Generate Signed Bundle / APK, and follow the prompts using your Keystore file.
