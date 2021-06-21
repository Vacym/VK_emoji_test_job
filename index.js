const LENGTH_HISTYORY = 25; // Максимальная длина истории смайликов


class EmojiContainer {
  constructor(container, emojis) {
    console.log(container);
    console.log(emojis);

    this.container    = container; // Контейнер
    this.emojis       = emojis;    // Эмодзи
    this.emojiHistory = [];        // История эмодзи

    // Показывается ли окно в данный момент
    this.show = false;
    
  }

  buildEmojis() { // Построение полотна из смайликов
    // Поле для всех смайликов
    let field = document.createElement('div');
    field.className = 'smiles-field show';
    field.id = 'fieldAll';


    // Рисуем каждую категорию
    for (const section of this.emojis) {

      // Заголовок категории
      field.innerHTML += `
        <span class="section-title">${section.title}</span>
      `;
      
      let smileSection = document.createElement('div');
      smileSection.className = 'smile-section';

      for (const emoji of section.items) {
        let buttonContainer = document.createElement('div');
        buttonContainer.className = 'button-container-small';
        // buttonContainer.innerHTML = `<button>${emoji}</button>`;

        let link = LINKS[emoji];

        buttonContainer.innerHTML = `<img src="${link}" alt="${emoji}"></img>`;

        smileSection.append(buttonContainer);

      }
      field.append(smileSection);
    }


    // Добавляем получившееся поле смайликов
    this.container.append(field);


    // Раздел с последними смайликами
    let fieldHistory = document.createElement('div');
    fieldHistory.className = 'smiles-field';
    fieldHistory.id = 'fieldHistory';

    fieldHistory.insertAdjacentHTML('beforeend', `
      <span class="section-title">Недавние</span>
      <div class="smile-section"></div>
    `);

    this.container.append(fieldHistory);



    // Bottom button bar
    this.container.innerHTML += `
      <div class="bottom-bar">
        <div class="button-container active" field="fieldAll">
          <button id="smile-bar"></button>
        </div>
        <div class="button-container" field="fieldHistory">
          <button id="clock-bar"></button>
        </div>
      </div>
    `;

    // Кнопки переключения всех смайликов и недавних
    const toggles = document.querySelectorAll('.bottom-bar .button-container');

    for (const toggle of toggles) {
      toggle.addEventListener('click', (e) => this.toggleField(
        toggle.getAttribute('field'),
        toggle.classList.contains('active')
      ));
    }
  }

  toggleField(showField, active) { // Переключение разделов эмодзи

    // Если кнопка уже активна
    if (active) return;

    this.container.querySelector('.smiles-field.show').classList.remove('show');
    this.container.querySelector('.smiles-field#' + showField).classList.add('show');

    this.container.querySelector('.bottom-bar .button-container.active').classList.remove('active');
    this.container.querySelector(`.bottom-bar .button-container[field=${showField}]`).classList.add('active');
  }

  correctCoords () { // Подправление координат окна
    let textarea = document.querySelector('.chat-form');
    let coord = textarea.getBoundingClientRect();

    // Тоже работает, но при изменении масштаба страницы сбивается
    // this.container.style.top = (coord.top - this.height - 12) + 'px';

    this.container.style.bottom = (document.documentElement.clientHeight - coord.top + 12) + 'px';
  }

  showing() { // Появление контейнера
    this.correctCoords();

    console.log('show');
    this.show = true;
    this.container.classList.add('show');

    document.addEventListener('mousedown', this.decisionToClick.bind(this), {once: true});
  }

  decisionToClick(event) { // определение клика мыши
    let slip = () => {
      document.removeEventListener('mousedown', this.decisionToClick.bind(this));
      this.hiding();
    };

    console.log(event);


    for (const element of event.path) { // Перебираем путь нажатия
      // Если document,
      // значит нажали не на контейнер смайликов,
      // значит его нужно убрать
      if (element == document) {
        slip(this);
        return;
      }
      // Если кнопка появления/исчесзновения смайликов
      // ничего не делаем
      // Кнопка сделает всё сама
      else if (element.id == "smile-icon") return;

      // Если нажатие внутри контейнера,
      // продолжаем обработку нажатия
      else if (element.classList.contains('smiles-container')) break;
    }

    if (
      event.target.nodeName == "BUTTON" &&
      event.target.parentElement.classList.contains('button-container-small')
      ) {
      this.addSmile(event.target.innerText);
    }
    else if (
      // Если нажали на смайл
      event.target.nodeName == "IMG" &&
      event.target.parentElement.classList.contains('button-container-small')
      ) {
      this.addSmile(event.target.alt);
    }

    // Возобновляем прослушку
    document.addEventListener('mousedown', this.decisionToClick.bind(this), {once: true});

  }

  hiding() { // Исчезновения контейнера
    console.log('hide');
    this.show = false;
    this.container.classList.remove('show');
  }

  toggle(event) { // Переключение видимости контейнера

    if (this.show) this.hiding();
    else           this.showing();
  }

  addSmile(smile) { // Добавление смайлика в поле ввода
    console.log('smile', smile);
    let textarea = document.querySelector('.chat-input');

    if (textarea.lastChild?textarea.lastChild.nodeName == 'BR':false) textarea.lastChild.remove();
    textarea.append(smile);
    
    this.emojiHistoryAdd(smile);
    this.correctCoords();
    
    input.formatInput({});
  }

  emojiHistoryAdd(emoji) { // Добавление смайлика в историю
    let index = this.emojiHistory.indexOf(emoji);

    if (index == -1 && this.emojiHistory.length >= LENGTH_HISTYORY) {
      this.emojiHistory.pop();
    }
    else if (index != -1) {
      this.emojiHistory.splice(index, 1);
    }
    
    this.emojiHistory.unshift(emoji);
    console.log(this.emojiHistory);
    this.updateHistory();
  }

  updateHistory() { // Обновление окна недвних смайликов
    let section = this.container.querySelector('#fieldHistory .smile-section');

    section.innerHTML = '';

    for (const smile of this.emojiHistory) {
      section.insertAdjacentHTML('beforeend', `
        <div class="button-container-small">
          <img src="${LINKS[smile]}" alt="${smile}">
        </div>
      `);
    }
  }
}


class Input {
  constructor(selector) {
    this.input = document.querySelector(selector);
    this.text  = '';
    this.savedSelection = {};

    this.input.addEventListener('input', this.formatInput.bind(this));
  }

  badTags(tag) {
    return (
      tag != '#text' &&
      tag != 'IMG'   &&
      tag != 'BR'  
    );
  }

  formatInput(e){ // Форматирование введённого текста
    const addCounters = (x) => {
      if (nodeCounter == startCounter) startCounter += x;
      if (nodeCounter == endCounter)   endCounter   += x;
      nodeCounter += x;
    };

    const formatPart = (node) => {
      let adding = null;

      
      if (node == this.savedSelection.start[0]) startCounter = nodeCounter;
      if (node == this.savedSelection.end[0])   endCounter   = nodeCounter;


      if (node.nodeName == '#text') {
        console.log('TEXT', node.nodeValue);
        adding = textConverter(node.nodeValue);
        let link = LINKS[adding];

        if (link) {
          adding = `<img class="emoji" src="${link}" alt="${adding}">`;
          console.log(adding);
        } else {
          if (lastNode && lastNode.nodeName == '#text'){
            if (nodeCounter == startCounter) 
            this.savedSelection.start[1] += lastNode.nodeValue.length;

            if (nodeCounter == endCounter) 
            this.savedSelection.end[1]   += lastNode.nodeValue.length;

            addCounters(-1);
          }
        }

      }
      else if(node.nodeName == 'IMG') {
        if(LINKS[node.alt]) {
          adding = `<img class="emoji" src="${LINKS[node.alt]}" alt="${node.alt}">`;
        }
      }
      else if (this.badTags(node.nodeName)) {
        adding = '';

        if(node.nodeName == 'DIV' || node.nodeName == 'P')
        if (lastNode && lastNode.nodeName != 'BR') {
          adding += '<br>';
          addCounters(1);

          if (node.nodeName == 'P'){
            adding += '<br>';
            addCounters(1);
          }

          lastNode = document.createElement('br');
        }

        for (let childNode of node.childNodes) {
          adding += formatPart(childNode);
        }


      }
      else if (node.nodeName == 'BR') {
        adding =  '<br>';
      }
      else {
        adding = '';
      }

      if(adding && !this.badTags(node.nodeName)){
        lastNode = node;
        nodeCounter++;
      }



      return adding;
    };

    console.log(e);

    
    this.saveSelection();
    console.log(this.savedSelection);
    let target = this.input;
    console.log([target]);
  
    console.log(target.innerHTML);
    let lastNode = null;
    let html = '';
    let carriage = 0;
    let [nodeCounter, startCounter, endCounter] = [0, -1, -1];

  

    for (let bigNode of target.childNodes) {
      console.log([bigNode]);

      let newHtml = formatPart(bigNode);


      html += newHtml;
    }
    
    

    let tempContent = document.createElement('div');
    tempContent.innerHTML = html;

    let tcn = tempContent.childNodes;



    if (tcn.length >= 1)
    if (tempContent.lastChild.nodeName == 'BR')
    if ((tcn.length >= 2)?(tcn[tcn.length-2].nodeName != 'BR'):true)
    tempContent.lastChild.remove();

    console.log(tempContent.innerHTML);
    target.innerHTML = tempContent.innerHTML;

    

    if (startCounter != -1) this.savedSelection.start[0] = target.childNodes[startCounter];
    if (endCounter   != -1) this.savedSelection.end[0]   = target.childNodes[endCounter];

    console.log(startCounter, endCounter);

    if(this.savedSelection)
    if (
      startCounter != -1 || this.savedSelection.start[0] == this.input &&
      endCounter   != -1 || this.savedSelection.end[0]   == this.input
    ) this.restoreSelection();
    
  }




  cloneSelection() {
    if (window.getSelection().rangeCount < 1) return null;
    let range = window.getSelection().getRangeAt(0);

    return {
      start: [range.startContainer, range.startOffset],
      end: [range.endContainer, range.endOffset],
    };
  }


  saveSelection() { // Сохраниение положения курсора
    this.savedSelection = this.cloneSelection();
  }
  
    

  restoreSelection() { // Восстановление положения курсора
    document.querySelector(".chat-input").focus();
    if (this.savedSelection != null) {
    if (window.getSelection)//non IE and there is already a selection
      {
        console.log('there is already a selection');

        let newRange = document.createRange();

        newRange.setStart(...this.savedSelection.start);
        newRange.setEnd(...this.savedSelection.end);




        var s = window.getSelection();
        if (s.rangeCount > 0) 
        s.removeAllRanges();
        
        console.log(this.savedSelection);
        s.addRange(newRange);
      }
      else if (document.createRange)//non IE and no selection
        {
          console.log('no selection');
          window.getSelection().addRange(this.savedRange);
        }
      else if (document.selection)//IE
      {
        this.savedRange.select();
      }
    }
  }
}


function textConverter(text) {
  text = text.replace('&', "&amp;");
  text = text.replace('>', "&gt;");
  text = text.replace('<', "&lt;");
  text = text.replace('"', "&quot;");
  text = text.replace("'", "&#039;");
  return text;
}





let emojis;
let input;

// Выполнение по загрузке DOM
document.addEventListener("DOMContentLoaded", () => {
  emojis = new EmojiContainer(
    document.querySelector('.smiles-container'),
    SECTIONS
  );
  emojis.buildEmojis();

  input = new Input('.chat-input');

  // Отслеживание клика на смайлик, который открывает смайлики
  document.querySelector('#smile-icon').onclick = (e) => {
    emojis.toggle(e);
  };

});
