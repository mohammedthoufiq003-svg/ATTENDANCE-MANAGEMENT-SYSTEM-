from flask import Flask, render_template

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/login")
def login():
    return render_template("login.html")

@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")

@app.route("/studentregistration")
def studentregistration():
    return render_template("studentregistration.html")

@app.route("/studentlist")
def studentlist():
    return render_template("studentlist.html")

@app.route("/facultyregistration")
def facultyregistration():
    return render_template("facultyregistration.html")

@app.route("/subjectmanagement")
def subjectmanagement():
    return render_template("subjectmanagement.html")

@app.route("/attendance")
def attendance():
    return render_template("attendance.html")

@app.route("/attendancehistory")
def attendancehistory():
    return render_template("attendancehistory.html")

@app.route("/report")
def report():
    return render_template("report.html")

@app.route("/attendancepercentage")
def attendancepercentage():
    return render_template("attendancepercentage.html")

@app.route("/searchstudent")
def searchstudent():
    return render_template("searchstudent.html")

@app.route("/profile")
def profile():
    return render_template("profile.html")

@app.route("/settings")
def settings():
    return render_template("settings.html")

@app.route("/logout")
def logout():
    return render_template("logout.html")

if __name__ == "__main__":
