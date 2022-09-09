(function(){
	//canvas
	var cnv = document.querySelector('canvas');
	//contexto de renderização 2d
	var ctx = cnv.getContext('2d');
	
	//RECURSOS DO JOGO ========================================================>
	//arrays
	var sprites = [];
	var assetsToLoad = [];
	var missiles = [];
	var bombs = [];
	var aliens = [];
	var messages = [];
	
	//variáveis úteis
	var alienFrequency = 200;
	var alienTimer = 0;
	var shots = 0;
	var hits = 0;
	var level = 1;
	var finish = 3;
	var use = 250;
	var acuracy = 0;
	var scoreToWin = 100;
	var FIRE = 0, EXPLOSION = 1;
	
	//sprites
	//cenário
	var background = new Sprite(0,90,400,500,0,0);
	sprites.push(background);
	
	//nave
	var defender = new Sprite(0,0,40,100,185,380);
	sprites.push(defender);
	
	//mensagem da tela inicial
	var startMessage = new ObjectMessage(cnv.height/2,"PRESSIONE ENTER","#fff");
	messages.push(startMessage);
	
	//mensagem de pausa
	var pausedMessage = new ObjectMessage(cnv.height/2,"PAUSE","#fff");
	pausedMessage.visible = false;
	messages.push(pausedMessage);
	
	//mensagem de game over
	var gameOverMessage = new ObjectMessage(cnv.height/2,"","#fff");
	gameOverMessage.visible = false;
	messages.push(gameOverMessage);
	
	//placar
	var scoreMessage = new ObjectMessage(10,"","#fff");
	scoreMessage.font = "normal bold 15px emulogic";
	updateScore();
	messages.push(scoreMessage);
	
	//imagem
	var img = new Image();
	img.addEventListener('load',loadHandler,false);
	img.src = "img/Dentista.png";
	assetsToLoad.push(img);
	//contador de recursos
	var loadedAssets = 0;
	
	
	//entradas
	var LEFT = 37, RIGHT = 39, ENTER = 13, UP = 38, C = 67, SPACE = 32;
	
	//ações
	var mvLeft = mvRight = shoot = shooter = Cshoot = spaceIsDown = false;
	
	//estados do jogo
	var LOADING = 0, PLAYING = 1, PAUSED = 2, OVER = 3;
	var gameState = LOADING;

	
	
	//listeners
	window.addEventListener('keydown',function(e){
		var key = e.keyCode;
		switch(key){
			case LEFT:
				mvLeft = true;
				break;
			case RIGHT:
				mvRight = true;
				break;
			case UP:
				shooter = true;
				break;
			case C:
				Cshoot = true;
				break;
			case SPACE:
				if(!spaceIsDown){
					shoot = true;
					spaceIsDown = true;
				}
				break;
		}
	},false);
	
	window.addEventListener('keyup',function(e){
		var key = e.keyCode;
		switch(key){
			case LEFT:
				mvLeft = false;
				break;
			case RIGHT:
				mvRight = false;
				break;
			case UP:
				mvRight = false;
				break;
			case ENTER:
				if(gameState !== OVER){
					if(gameState !== PLAYING){
						gameState = PLAYING;
						startMessage.visible = false;
						pausedMessage.visible = false;
						toggleFullScreen()
						$('#choose').attr('src', 'img/controls/pause.png');
					} else {
						gameState = PAUSED;
						pausedMessage.visible = true;
						toggleFullScreen()
						$('#choose').attr('src', 'img/controls/play.png');
					}
				}
				break;
			case SPACE:
				spaceIsDown = false;
		}
	},false);
	
	//FUNÇÕES =================================================================>
	function loadHandler(){
		loadedAssets++;
		if(loadedAssets === assetsToLoad.length){
			img.removeEventListener('load',loadHandler,false);
			//inicia o jogo
			gameState = PAUSED;
		}
	}

	
	function loop(){
		requestAnimationFrame(loop, cnv);
		//define as ações com base no estado do jogo
		switch(gameState){
			case LOADING:
				console.log('CARREGANDO...');
				break;
			case PLAYING:
				update();
				break;
			case OVER:
				endGame();
				setTimeout(function(){
					location.reload();
				},3000);
				break;
		}
		render();
	}

	$('#left').keypress(()=>{
		mvLeft = true
		setTimeout(()=>{
			mvLeft = false;
		},100)
	})
	// $('#left').click(()=>{
	// 	mvLeft = true
	// })
	// .mouseup(()=>{
	// 	mvLeft = false
	// })
	$('#circle').click(()=>{
		// shoot = true
		fireMissile()
		// setTimeout(()=>{
		// 	shoot = false;
		// },10)
	})
	// .mouseup(()=>{
	// 	shoot = false
	// })
	$('#right').keypress(()=>{
		mvRight = true
		setTimeout(()=>{
			mvRight = false;
		},100)
	})
	// .mouseup(()=>{
	// 	mvRight = false
	// })
	$('#power').click(()=>{
		shooter = true
		setTimeout(()=>{
			shooter = false;
		},1000)
	})
	// .mouseup(()=>{
	// 	setTimeout(()=>{
	// 		shooter = false;
	// 	},1000)
	// 	use--
	// })
	$('#choose').click(()=>{
		if(gameState !== OVER){
			if(gameState !== PLAYING){
				gameState = PLAYING;
				startMessage.visible = false;
				pausedMessage.visible = false;
				$('#choose').attr('src', 'img/controls/pause.png');
			} else {
				gameState = PAUSED;
				pausedMessage.visible = true;
				$('#choose').attr('src', 'img/controls/play.png');
			}
		}
	})
	  
	
	function update(){
		//move para a esquerda
		if(mvLeft && !mvRight){
			defender.vx = -5;
		}
		
		//move para a direita
		if(mvRight && !mvLeft){
			defender.vx = 5;
		}
		
		//para a nave
		if(!mvLeft && !mvRight){
			defender.vx = 0;
		}
		
		//dispara o canhão
		if(shoot){
			fireMissile();
			shoot = false;
		}

		if(shooter && level == 2 && use > 0){
			fireBomb();
			// shooter = true;
			setTimeout(()=>{
				shooter = false;
			},1000)
			use--
		}


		//atualiza a posição
		defender.x = Math.max(0,Math.min(cnv.width - defender.width, defender.x + defender.vx));
		
		//atualiza a posição dos mísseis
		for(var i in missiles){
			var missile = missiles[i];
			missile.y += missile.vy;
			if(missile.y < -missile.height){
				removeObjects(missile,missiles);
				removeObjects(missile,sprites);
				updateScore();
				i--;
			}
		}
		
		//atualiza a posição das bombas
		for(var i in bombs){
			var bomb = bombs[i];
			bomb.y += bomb.vy;
			if(bomb.y < -bomb.height){
				removeObjects(bomb,bombs);
				removeObjects(bomb,sprites);
				updateScore();
				i--;
			}
		}
		
		//encremento do alienTimer
		alienTimer++;
		
		//criação do alien, caso o timer se iguale à frequência
		if(alienTimer === alienFrequency){
			makeAlien();
			alienTimer = 0;
			//ajuste na frequência de criação de aliens
			if(alienFrequency > 2){
				alienFrequency--;
			}
		}
		
		//move os aliens
		for(var i in aliens){
			var alien = aliens[i];
			if(alien.state !== alien.EXPLODED){
				alien.y += alien.vy;
				if(alien.state === alien.CRAZY){
					if(alien.x > cnv.width - alien.width || alien.x < 0){
						alien.vx *= -1;
					}
					alien.x += alien.vx;
				}
			}
			
			//confere se algum alien chegou à Terra
			if(alien.y == cnv.height + alien.height){
				gameState = OVER;
			}
			
			//confere se algum alien colidiu com a nave
			if(collide(alien,defender)){
				destroyAlien(alien);
				removeObjects(defender,sprites);
				gameState = OVER;
			}
			
			//confere se algum alien foi destruido
			for(var j in missiles){
				var missile = missiles[j];
				if(collide(missile,alien) && alien.state !== alien.EXPLODED){
					destroyAlien(alien);
					hits++;
					use = use + Math.floor(Math.random() * 50)
					updateScore();
					if(parseInt(hits) === scoreToWin){
						gameState = OVER;
						//destroi todos os aliens
						for(var k in aliens){
							var alienk = aliens[k];
							destroyAlien(alienk);
						}
					}
					removeObjects(missile,missiles);
					removeObjects(missile,sprites);
					j--;
					i--;
				}
			}

			//confere se algum alien foi destruido
			for(var j in bombs){
				var bomb = bombs[j];
				if(collide(bomb,alien) && alien.state !== alien.EXPLODED){
					destroyAlien(alien);
					hits++;
					updateScore();
					if(parseInt(hits) === scoreToWin){
						gameState = OVER;
						//destroi todos os aliens
						for(var k in aliens){
							var alienk = aliens[k];
							destroyAlien(alienk);
						}
					}
					removeObjects(bomb,bombs);
					removeObjects(bomb,sprites);
					j--;
					i--;
				}
			}
		}//fim da movimentação dos aliens
	}//fim do update
	
	//criação dos mísseis
	function fireMissile(){
		var missile = new Sprite(180,0,40,50,defender.centerX() - 20,defender.y - 13);
		missile.vy = -8;
		sprites.push(missile);
		missiles.push(missile);
		playSound(FIRE);
		shots++;
	}
	
	//criação dos bomba
	function fireBomb(){
		var bomb = new Sprite(310,25,50,30,defender.centerX() - 20,defender.y - 13);
		bomb.vy = -25;
		sprites.push(bomb);
		bombs.push(bomb);
		playSound(FIRE);
		shots++;
	}

	//cração de aliens
	function makeAlien(){
		//cria um valor aleatório entre 0 e 7 => largura do canvas / largura do alien
		//divide o canvas em 8 colunas para o posicionamento aleatório do alien
		var alienPosition = (Math.floor(Math.random() * 8)) * 50;
		
		var alien = new Alien(50,0,70,75,alienPosition,-50);
		alien.vy = 1;
		
		//otimização do alien
		if(Math.floor(Math.random() * 11) > 7){
			alien.state = alien.CRAZY;
			alien.vx = 2;
		}
		
		if(Math.floor(Math.random() * 11) > 5){
			alien.vy = 2;
		}
		
		sprites.push(alien);
		aliens.push(alien);
	}
	
	//destroi aliens
	function destroyAlien(alien){
		alien.state = alien.EXPLODED;
		alien.explode();
		playSound(EXPLOSION);
		setTimeout(function(){
			removeObjects(alien,aliens);
			removeObjects(alien,sprites);
		},1000);
	}
	
	//remove os objetos do jogo
	function removeObjects(objectToRemove,array){
		var i = array.indexOf(objectToRemove);
		if(i !== -1){
			array.splice(i,1);
		}
	}
	
	//atualização do placar
	function updateScore(){
		//cálculo do aproveitamento
		if(shots === 0){
			acuracy = 100;
		} else {
			acuracy = Math.floor((hits/shots) * 100);
		}
		//ajuste no texto do aproveitamento
		if(acuracy < 100){
			acuracy = acuracy.toString();
			if(acuracy.length < 2){
				acuracy = "  " + acuracy;
			} else {
				acuracy = " " + acuracy;
			}
		}
		//ajuste no texto do hits
		hits = hits.toString();
		if(hits.length < 2){
			hits = "0" + hits;
		}

		$( "#record-pontos" ).css( "color", "#0f0" ).text( localStorage.getItem('Pontos') );
		$( "#record-taxa" ).css( "color", "#0f0" ).text( localStorage.getItem('Taxa') ).append('%');
		$( "#record-tentativas" ).css( "color", "#0f0" ).text( localStorage.getItem('Tentativas') );
		$( "#record-level" ).css( "color", "#0f0" ).text( localStorage.getItem('Level') );
		///////////////////////////////////////////////////////////
		$( "#info-pontos" ).css( "color", "red" ).text( hits );
		$( "#info-taxa" ).css( "color", "red" ).text( acuracy + '%' );
		$( "#info-tentativas" ).css( "color", "red" ).text( shots );
		$( "#info-level" ).css( "color", "red" ).text( level );
		
		// / / / / / / / / / / / / / / / / / / / / / 

		if(hits > localStorage.getItem('Pontos')){
			localStorage.setItem('Pontos', hits)
		}
		// if(acuracy > localStorage.getItem('Taxa')){
			localStorage.setItem('Taxa', acuracy)
		// }
		if(shots > localStorage.getItem('Tentativas')){
			localStorage.setItem('Tentativas', shots)
		}
		if(level > localStorage.getItem('Level')){
			localStorage.setItem('Level', level)
		}


		//Levels
		if(hits >= 25 && hits < 50){
			level = 2
			if(hits == 25){
				gameOverMessage.text = "Level 2";
				gameOverMessage.visible = true;
				setTimeout(() => {
					gameOverMessage.visible = false;
				}, 2000);
			}
		} else if(hits >= 50 && hits < 75){
			level = 3
			if(hits == 50){
				gameOverMessage.text = "Level 3";
				gameOverMessage.visible = true;
				setTimeout(() => {
					gameOverMessage.visible = false;
				}, 2000);
			}
		} else if(hits >= 75 && hits < 100){
			level = 4
			if(hits == 75){
				gameOverMessage.text = "Level 4";
				gameOverMessage.visible = true;
				setTimeout(() => {
					gameOverMessage.visible = false;
				}, 2000);
			}
		}

		scoreMessage.text = "Level: " + level + "     Pontos: " + hits;
		//+ " - Precisao: " + acuracy + "%";
	}
	
	//função de game over
	function endGame(){
		if(hits < scoreToWin){
			gameOverMessage.text = "PERDEU!";
		} else {
			gameOverMessage.text = "GANHOU!";
			gameOverMessage.color = "#00f";
		}
		gameOverMessage.visible = true;
	}
	
	//efeitos sonoros do jogo
	function playSound(soundType){
		var sound = document.createElement("audio");
		if(soundType === EXPLOSION){
			sound.src = "sound/explosion.mp3";
		} else {
			sound.src = "sound/fire.mp3";
		}
		sound.addEventListener("canplaythrough",function(){
			sound.play();
		},false);
	}
	
	function render(){
		ctx.clearRect(0,0,cnv.width,cnv.height);
		//exibe os sprites
		if(sprites.length !== 0){
			for(var i in sprites){
				var spr = sprites[i];
				ctx.drawImage(img,spr.sourceX,spr.sourceY,spr.width,spr.height,Math.floor(spr.x),Math.floor(spr.y),spr.width,spr.height);
			}
		}
		//exibe os textos
		if(messages.length !== 0){
			for(var i in messages){
				var message = messages[i];
				if(message.visible){
					ctx.font = message.font;
					ctx.fillStyle = message.color;
					ctx.textBaseline = message.baseline;
					message.x = (cnv.width - ctx.measureText(message.text).width)/2;
					ctx.fillText(message.text,message.x,message.y);
				}
			}
		}
	}
	
	loop();
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
}());

function toggleFullScreen() {
	if ((document.fullScreenElement && document.fullScreenElement !== null) ||    
	 (!document.mozFullScreen && !document.webkitIsFullScreen)) {
	  if (document.documentElement.requestFullScreen) {  
		document.documentElement.requestFullScreen();  
	  } else if (document.documentElement.mozRequestFullScreen) {  
		document.documentElement.mozRequestFullScreen();  
	  } else if (document.documentElement.webkitRequestFullScreen) {  
		document.documentElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);  
	  }  
	} else {  
	  if (document.cancelFullScreen) {  
		document.cancelFullScreen();  
	  } else if (document.mozCancelFullScreen) {  
		document.mozCancelFullScreen();  
	  } else if (document.webkitCancelFullScreen) {  
		document.webkitCancelFullScreen();  
	  }  
	}  
  } 
