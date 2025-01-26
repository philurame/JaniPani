
<style>
.title-variant3 a {
  font-family: 'Arial', sans-serif;
  text-decoration: none;
  transition: 0.5s;
  display: inline-block;
  position: relative;
}
.title-variant3 a:hover {
  color: #fff;
  text-shadow: 0 0 5px #ff00ff, 0 0 10px #ff00ff, 0 0 20px #ff00ff, 0 0 40px #ff00ff;
  animation: neonCycle 1s infinite alternate;
}
@keyframes neonCycle { 
  0% {
    text-shadow: 0 0 5px #ff00ff, 0 0 10px #ff00ff, 0 0 20px #ff00ff, 0 0 40px #ff00ff;
    color: #ff00ff;
  } 50% {
    text-shadow: 0 0 5px #00ffff, 0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 40px #00ffff;
    color: #00ffff;
  } 100% {
    text-shadow: 0 0 5px #ffff00, 0 0 10px #ffff00, 0 0 20px #ffff00, 0 0 40px #ffff00;
    color: #ffff00;
  }
}
.slide-bounce {
  font-family: 'Helvetica Neue', Arial, sans-serif;
  font-size: 3em;
  font-weight: bold;
  text-align: center;
  color: #f54f8e;
  animation: slideIn 2s ease-out, bounce 2s 2s infinite;
}
@keyframes slideIn {
  0% {transform: translateX(-100%);opacity: 0;} 
  60% {transform: translateX(10%);opacity: 1;} 
  100% {transform: translateX(0);}
}
@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {transform: translateY(0);}
  40% {transform: translateY(-20px);}
  60% {transform:translateY(-10px);}
}
</style>
<h1 class="title-variant3"><a href="https://philurame.github.io/JaniPani/" target="_blank">JaniPani</a></h1>
<div class="slide-bounce">おはよう!</div>


Welcome to **JaniPani**, the **free full version** of [WaniKani](https://www.wanikani.com/) (2023 edition, with minor updates in early 2025).

---

### Getting Started
> If you're already familiar with [WaniKani](https://www.wanikani.com/) (or [JaniPani](https://github.com/philurame/janipani)), jump straight to [CustomProgress.ipynb](CustomProgress.ipynb) to adjust your progress!

---

### Visuals

#### Review Feedback
![alt text](extras/correct.png)

![alt text](extras/incorrect.png)

#### Mnemonics
![alt text](extras/mnemonics_reading.png)

![alt text](extras/mnemonics_meaning.png)

#### Search Panel
![alt text](extras/info_search.png)

---