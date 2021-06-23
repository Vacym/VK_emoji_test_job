const LENGTH_HISTORY = 30; // Максимальная длина истории смайликов


class EmojiContainer {
  constructor(container, emojis) {
    this.container    = container; // Контейнер
    this.emojis       = emojis;    // Эмодзи
    this.emojiHistory = localStorage.getItem('emojiHistory'); // История эмодзи
    this.lastHistory  = []; // Последняя обновлённая история

    try {
      this.emojiHistory = JSON.parse(this.emojiHistory);
      if(!Array.isArray(this.emojiHistory)) this.emojiHistory = [];
    } catch (e) {
      console.log(e);
      this.emojiHistory = [];
    }

    
    // Показывается ли окно в данный момент
    this.show = false;
    
  }

  buildEmojis() { // Генерация основы под смайлики
    // Поле для всех смайликов
    let field = document.createElement('div');
    field.className = 'smiles-field show';
    field.id = 'fieldAll';



    // Добавляем получившееся поле смайликов
    this.container.append(field);
    this.field = field;
    this.loadScrolling();


    // Раздел с последними смайликами
    let fieldHistory = document.createElement('div');
    fieldHistory.className = 'smiles-field';
    fieldHistory.id = 'fieldHistory';

    fieldHistory.insertAdjacentHTML('beforeend', `
      <span class="section-title">Недавние</span>
      <div class="smile-section"></div>
    `);

    this.container.append(fieldHistory);
    this.updateHistory();



    // Bottom button bar
    let buttomBar = document.createElement('div');
    buttomBar.className = 'bottom-bar';

    buttomBar.innerHTML = `
      <div class="button-container active" field="fieldAll">
        <button id="smile-bar"></button>
      </div>
      <div class="button-container" field="fieldHistory">
        <button id="clock-bar"></button>
      </div>
    `;

    this.container.append(buttomBar);

    // Кнопки переключения всех смайликов и недавних
    const toggles = document.querySelectorAll('.bottom-bar .button-container');

    for (const toggle of toggles) {
      toggle.addEventListener('click', (e) => this.toggleField(
        toggle.getAttribute('field'),
        toggle.classList.contains('active')
      ));
    }
  }

  loadScrolling() {// Построение полотна из смайликов по прокрутке
    const loadNewSection = () => {
      if (field.scrollHeight - field.scrollTop - field.clientHeight > 100) return;

      
      // Рисуем каждую категорию

      const iter = iterator.next();
      if (iter.done) {
        field.removeEventListener('scroll', loadNewSection);
        return;
      }

      const section = iter.value;

      // Заголовок категории
      field.innerHTML += `
        <span class="section-title">${section.title}</span>
      `;
      
      const smileSection = document.createElement('div');
      smileSection.className = 'smile-section';

      for (const emoji of section.items) {
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'button-container-small';

        const link = LINKS[emoji];
        buttonContainer.innerHTML = `<img src="${link}" alt="${emoji}"></img>`;

        smileSection.append(buttonContainer);

      }
      field.append(smileSection);
    };


    const field = document.querySelector('#fieldAll');
    const iterator = this.emojis[Symbol.iterator]();


    loadNewSection();

    field.addEventListener('scroll', loadNewSection);
  }

  toggleField(showField, active) { // Переключение разделов эмодзи

    // Если кнопка уже активна
    if (active) return;

    if (showField == 'fieldHistory')
    this.updateHistory();

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

    this.updateHistory();

    document.addEventListener('mousedown', this.decisionToClick.bind(this), {once: true});
  }

  decisionToClick(event) { // определение клика мыши
    let slip = () => {
      document.removeEventListener('mousedown', this.decisionToClick.bind(this));
      this.hiding();
    };

    console.log(event);

    if (!event.path) { // For Mozila Firefox
      event.path = {target: event.target};

      event.path[Symbol.iterator] = function() {
        return {
          current: this.target,
          nextCurrent: null,

          next() {
            if (this.current == window)
            return {done: true};

            this.current = this.nextCurrent || this.current;
            this.nextCurrent = this.current.parentNode || window;

            return {
              done: false, value: this.current
            };
          }
        };
      };
    }


    for (const element of event.path) { // Перебираем путь нажатия
      // Если document,
      // значит нажали не на контейнер смайликов,
      // значит его нужно убрать
      if (element == document) {
        slip();
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

    if (index == -1 && this.emojiHistory.length >= LENGTH_HISTORY) {
      this.emojiHistory.pop();
    }
    else if (index != -1) {
      this.emojiHistory.splice(index, 1);
    }
    
    this.emojiHistory.unshift(emoji);

    if (document.querySelector('.button-container.active:not([field="fieldHistory"])'))
    this.updateHistory();
  }

  updateHistory() { // Обновление окна недвних смайликов
    // Если смайлики не изменились, то и отрисовывать их нет смысла
    if (
      this.emojiHistory.length == this.lastHistory.length &&
      this.emojiHistory.every((value, index) => value === this.lastHistory[index]))
    return;

    this.lastHistory = [...this.emojiHistory];
    let section = this.container.querySelector('#fieldHistory .smile-section');

    section.innerHTML = '';

    for (const smile of this.emojiHistory) {
      section.insertAdjacentHTML('beforeend', `
        <div class="button-container-small">
          <img src="${LINKS[smile]}" alt="${smile}">
        </div>
      `);
    }
    localStorage.setItem('emojiHistory', JSON.stringify(this.emojiHistory));
  }
}


class Input {
  constructor(selector) {
    this.input = document.querySelector(selector);
    this.input.focus(); // Firefox

    this.input.addEventListener('input', this.formatInput.bind(this));

    this.input.addEventListener('paste', e => { // Fix входных данных
      e.preventDefault();
      let text = e.clipboardData.getData('text');
      if (!text) return;
      this.insertTextAtCaret(text);
    });
  }

  badTags(tag) { // Проверяет наличие плохого тега
    return !['#text', 'IMG', 'BR'].includes(tag);
  }

  formatInput(e){ // Форматирование введённого текста
    const formatPart = (node) => {
      let adding = [];

      if (node.nodeName == '#text') {
        let text = node.nodeValue;
        let newText = '';

        for (const letter of text) {
          const link = LINKS[letter];

          if (link) {
            if (newText) adding.push(document.createTextNode(newText));
            newText = '';

            let smile = document.createElement('img');
            smile.className = 'emoji';
            smile.alt = letter;
            smile.src = link;
            
            adding.push(smile);
          } else {
            newText += letter;
          }
        }

        if (newText) adding.push(document.createTextNode(newText));
      }
      else if(node.nodeName == 'IMG') {
        if(LINKS[node.alt]) {
          let smile = document.createElement('img');
          smile.src = LINKS[node.alt];
          smile.className = 'emoji';
          smile.alt = node.alt;
          
          adding.push(smile);
        } else {
          console.log("Невозможно!");
        }
      }
      else if (this.badTags(node.nodeName)) {
        
        if(node.nodeName == 'DIV')
        if (lastNode && lastNode.nodeName != 'BR') {
          adding.push(document.createElement('br'));

          lastNode = document.createElement('br');
        }

        for (let childNode of node.childNodes) {
          adding.push(...formatPart(childNode));
        }


      }
      else if (node.nodeName == 'BR') {
        adding.push(node);
      }
      

      if(adding && !this.badTags(node.nodeName)){
        lastNode = node;
      }



      return adding;
    };

    console.log(e);

    
    let target = this.input;
    console.log([target]);
  
    console.log(target.innerHTML);
    let lastNode = null;
    let changes = {};

  

    for (let nodeNumber = 0; nodeNumber < target.childNodes.length; nodeNumber++) {
      const node = target.childNodes[nodeNumber];

      let newNodes = formatPart(node);

      if (newNodes.length > 1 || newNodes[0].nodeName != node.nodeName) {
        changes[nodeNumber] = newNodes;
      }
      
    }
    
    let x = -1;
    let childNodesClone = [...target.childNodes];
    for (let element of childNodesClone) {
      x++;

      if (!changes[x]) continue;

      element.replaceWith(...changes[x]);

      // Восстановление позиции курсора
      let range = window.getSelection().getRangeAt(0);
      range.deleteContents();
      range.setStart(target, x + changes[x].length);
      range.setEnd(target, x + changes[x].length);
    }
    
    // Удаляем одиночный <br> в конце
    let tcn = target.childNodes;
    if (tcn.length && target.lastChild.nodeName == 'BR')
    if (tcn.length == 1 || tcn[tcn.length - 2].nodeName != 'BR')
    target.lastChild.remove();

  }



  insertTextAtCaret(text) {
    var sel, range;
    if (window.getSelection) {
      sel = window.getSelection();
      if (sel.getRangeAt && sel.rangeCount) {
        let textNode = document.createElement('span');
        textNode.innerText = text;
        

        range = sel.getRangeAt(0);
        range.deleteContents();
        
        range.insertNode( textNode );
        range.setStart(range.endContainer, range.endOffset);
        this.formatInput({});
      }
    } else if (document.selection && document.selection.createRange) {
        document.selection.createRange().text = text;
    }
  }
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
