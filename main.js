
let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

ctx.font = "40px Fantasy";
//globals
 
let HEIGHT = canvas.height;
let WIDTH = canvas.width;
let timeWhenGameStarted = Date.now();   //return time in ms
let frameCount = 0;
let score = 0;
let paused = false;

let interval;
let player;
let sound = {play : "./img/1-32 Forest Kingdom (8bit).mp3", 
over : "./img/1-09. Song of the Ancients (Arranged by Jun Hayakawa with Atsuki Yoshida) [EMO Quartet..mp3"}
let gameOn = false;
let enemyList = {};
let bulletList = {};
 

let img = {};
img.player = new Image ();
img.player.src = "./img/player.gif";



 img.enemy = new Image ();
 img.enemy.src = "./img/enemy.gif";
 //img.enemy.onload = () => this.draw().bind(this).bind(this)
 img.enemy2 = new Image ();
 img.enemy2.src = "./img/enemy2.png";
 img.bullet = new Image ();
 img.bullet.src = "./img/fireball.png";
 img.upgrade1 = new Image ();
 img.upgrade1.src = "./img/heart.png";
 img.upgrade2 = new Image ();
 img.upgrade2.src = "./img/score.png";


 
 Player = function(){
	var self = Actor('player','myId',50,40,90,90,img.player,10,1);
        
        var super_update = self.update;
	self.update = function(){
		super_update();
		if(self.pressingMouseLeft)
			self.performAttack();
		if(self.pressingMouseRight)
			self.performSpecialAttack();
	}	
	self.updatePosition = function(){
		if(self.pressingRight)
			self.x += 10;
		if(self.pressingLeft)
			self.x -= 10;	
		if(self.pressingDown)
			self.y += 10;	
		if(self.pressingUp)
			self.y -= 10;	
		
		//ispositionvalid
		if(self.x < self.width/2)
			self.x = self.width/2;
		if(self.x > Maps.current.width-self.width/2)
			self.x = Maps.current.width - self.width/2;
		if(self.y < self.height/2)
			self.y = self.height/2;
		if(self.y > Maps.current.height - self.height/2)
			self.y = Maps.current.height - self.height/2;
	}
	self.onDeath = function(){
		var timeSurvived = Date.now() - timeWhenGameStarted;		
		console.log("You lost! You survived for " + timeSurvived + " ms.");		
		gameOver();
	}
	self.pressingDown = false;
	self.pressingUp = false;
	self.pressingLeft = false;
        self.pressingRight = false;
        
        self.pressingMouseLeft = false;
        self.pressingMouseRight = false;
        
	return self;
	
	
}

Entity = function(type,id,x,y,width,height,img){
	var self = {
		type:type,
		id:id,
		x:x,
		y:y,
		width:width,
		height:height,
		img:img,
	};
	self.update = function(){
		self.updatePosition();
		self.draw();
	}
	self.draw = function(){
		ctx.save();
		var x = self.x - player.x;
		var y = self.y - player.y;
		
		x += WIDTH/2;
		y += HEIGHT/2;
		
		x -= self.width/2;
		y -= self.height/2;
		
		ctx.drawImage(self.img,
			0,0,self.img.width,self.img.height,
			x,y,self.width,self.height
		);
		
		ctx.restore();
	}
	self.getDistance = function(entity2){	//return distance (number)
		var vx = self.x - entity2.x;
		var vy = self.y - entity2.y;
		return Math.sqrt(vx*vx+vy*vy);
	}

	self.testCollision = function(entity2){	//return if colliding (true/false)
		var rect1 = {
			x:self.x-self.width/2,
			y:self.y-self.height/2,
			width:self.width,
			height:self.height,
		}
		var rect2 = {
			x:entity2.x-entity2.width/2,
			y:entity2.y-entity2.height/2,
			width:entity2.width,
			height:entity2.height,
		}
		return testCollisionRectRect(rect1,rect2);
		
	}
	self.updatePosition = function(){}
	
	return self;
}

Actor = function(type,id,x,y,width,height,img,hp,atkSpd){
        let self = Entity(type,id,x,y,width,height,img);
       
        self.hp = hp;
        self.hpMax = hp;
        self.atkSpd = atkSpd;
        self.attackCounter = 0;
        self.aimAngle = 0;
       
        let super_update = self.update;
        self.update = function(){
                super_update();
		self.attackCounter += self.atkSpd;
		if(self.hp <= 0)
                 self.onDeath();
        }
        self.onDeath = function(){};

        self.performAttack = function(){
                if(self.attackCounter > 25){    //every 1 sec
                        self.attackCounter = 0;
                        Bullet.generate(self);
                }
        }
       
        self.performSpecialAttack = function(){
                if(self.attackCounter > 50){    //every 1 sec
                        self.attackCounter = 0;
                        /*
                        for(var i = 0 ; i < 360; i++){
                                Bullet.generate(self,i);
                        }
                        */
                        Bullet.generate(self,self.aimAngle - 5);
                        Bullet.generate(self,self.aimAngle);
                        Bullet.generate(self,self.aimAngle + 5);
                }
        }
 
       
        return self;
}
 
Enemy = function(id,x,y,width,height,img,hp,atkSpd){
        let self = Actor('enemy',id,x,y,width,height,img,hp,atkSpd);
        Enemy.list[id] = self;

        self.toRemove = false;
	
	let super_update = self.update; 
	self.update = function(){
		super_update();
		self.updateAim();
		self.performAttack()
	}
	self.updateAim = function(){
		var diffX = player.x - self.x;
		var diffY = player.y - self.y;
		
		self.aimAngle = Math.atan2(diffY,diffX) / Math.PI * 180
	}
        var super_draw = self.draw; 
	self.draw = function(){
		super_draw();
		var x = self.x - player.x + WIDTH/2;
		var y = self.y - player.y + HEIGHT/2 - self.height/2 - 20;
		
		ctx.save();
		ctx.fillStyle = 'red';
		var width = 100*self.hp/self.hpMax;
		if(width < 0)
			width = 0;
		ctx.fillRect(x-50,y,width,10);
		
		ctx.strokeStyle = 'black';
		ctx.strokeRect(x-50,y,100,10);
		
		ctx.restore();
	
	}
        
	self.onDeath = function(){
		self.toRemove = true;
	}
	
	self.updatePosition = function(){
		var diffX = player.x - self.x;
		var diffY = player.y - self.y;
		
		if(diffX > 0)
		 self.x += 3;
		else
		 self.x -= 3;
			
		if(diffY > 0)
		 self.y += 3;
		else
	 	 self.y -= 3;
	
	}
}
Enemy.list = {};

Enemy.update = function(){
	if(frameCount % 100 === 0)	//every 4 sec
		Enemy.randomlyGenerate();
	for(var key in Enemy.list){
		Enemy.list[key].update();
	}
	for(var key in Enemy.list){
		if(Enemy.list[key].toRemove)
		delete Enemy.list[key];
	}
}
 
Enemy.randomlyGenerate = function(){
        //Math.random() returns a number between 0 and 1
        let x = Math.random()*Maps.current.width;
        let y = Math.random()*Maps.current.height;
        let height = 130;     //between 10 and 40
        let width = 130;
        let id = Math.random();
        if(Math.random() < 0.5)
        Enemy(id,x,y,width,height,img.enemy2,2,1);
	 else
        Enemy(id,x,y,width,height,img.enemy,1,3);
       
}
 
Upgrade = function (id,x,y,width,height,category,img){
        let self = Entity('upgrade',id,x,y,width,height,img);
       
        self.category = category;
        Upgrade.list[id] = self;
}

Upgrade.list = {};
 
Upgrade.update = function(){
	if(frameCount % 75 === 0)	//every 3 sec
		Upgrade.randomlyGenerate();
	for(var key in Upgrade.list){
		Upgrade.list[key].update();
		var isColliding = player.testCollision(Upgrade.list[key]);
		if(isColliding){
			if(Upgrade.list[key].category === 'score')
				score += 1000;
			if(Upgrade.list[key].category === 'atkSpd')
				player.atkSpd += 3;
			delete Upgrade.list[key];
		}
	}
}

Upgrade.randomlyGenerate = function(){
        //Math.random() returns a number between 0 and 1
        let x = Math.random()*Maps.current.width;
        let y = Math.random()*Maps.current.height;
        let height = 52;
        let width = 52;
        let id = Math.random();

       
        if(Math.random()<0.5){
                var category = 'score';
                var Img = img.upgrade2;
        } else {
                var category = 'atkSpd';
                var Img = img.upgrade1;
        }
       
        Upgrade(id,x,y,width,height,category,Img);
}
 
Bullet = function (id,x,y,spdX,spdY,width,height,combatType){
        let self = Entity('bullet',id,x,y,width,height,img.bullet);
       
        self.timer = 0;
	self.combatType = combatType;
	self.spdX = spdX;
	self.spdY = spdY;
	
	self.updatePosition = function(){
		self.x += self.spdX;
		self.y += self.spdY;
				
		if(self.x < 0 || self.x > Maps.current.width){
			self.spdX = -self.spdX;
		}
		if(self.y < 0 || self.y > Maps.current.height){
			self.spdY = -self.spdY;
		}
	}
	
	
	Bullet.list[id] = self;
}

Bullet.list = {};

Bullet.update = function(){
	for(var key in Bullet.list){
		var b = Bullet.list[key];
		b.update();
		
		var toRemove = false;
		b.timer++;
		if(b.timer > 75){
			toRemove = true;
		}
		
		if(b.combatType === 'player'){	//bullet was shot by player
			for(var key2 in Enemy.list){
				if(b.testCollision(Enemy.list[key2])){
					toRemove = true;
					Enemy.list[key2].hp -= 1;
				}				
			}
		} else if(b.combatType === 'enemy'){
			if(b.testCollision(player)){
				toRemove = true;
				player.hp -= 1;
			}
		}	
		
		
		if(toRemove){
			delete Bullet.list[key];
		}
	}
}


 
Bullet.generate = function(actor,aimOverwrite){
        //Math.random() returns a number between 0 and 1
        let x = actor.x;
        let y = actor.y;
        let height = 70;
        let width = 70;
        let id = Math.random();
       
        let angle;
        if(aimOverwrite !== undefined)
                angle = aimOverwrite;
        else angle = actor.aimAngle;
       
        let spdX = Math.cos(angle/180*Math.PI)*10;
        let spdY = Math.sin(angle/180*Math.PI)*10;
        Bullet(id,x,y,spdX,spdY,width,height,actor.type);
}
 
testCollisionRectRect = function(rect1,rect2){
        return rect1.x <= rect2.x+rect2.width
                && rect2.x <= rect1.x+rect1.width
                && rect1.y <= rect2.y + rect2.height
                && rect2.y <= rect1.y + rect1.height;
}
 
 
document.onmousedown = function(mouse){
	if(mouse.which === 1)
		player.pressingMouseLeft = true;
	else
		player.pressingMouseRight = true;
}
document.onmouseup = function(mouse){
	if(mouse.which === 1)
		player.pressingMouseLeft = false;
	else
		player.pressingMouseRight = false;
}
document.oncontextmenu = function(mouse){
	mouse.preventDefault();
}

document.onmousemove = function(mouse){
	var mouseX = mouse.clientX - document.getElementById('canvas').getBoundingClientRect().left;
	var mouseY = mouse.clientY - document.getElementById('canvas').getBoundingClientRect().top;
	
	mouseX -= WIDTH/2;
	mouseY -= HEIGHT/2;
	
	player.aimAngle = Math.atan2(mouseY,mouseX) / Math.PI * 180;
}
 
document.onkeydown = function(event){
        if(event.keyCode === 32){
           player.performAttack();
        }
        if(event.keyCode === 68)        //d
                player.pressingRight = true;
        else if(event.keyCode === 83)   //s
                player.pressingDown = true;
        else if(event.keyCode === 65) //a
                player.pressingLeft = true;
        else if(event.keyCode === 87) // w
                player.pressingUp = true;

         else if(event.keyCode === 80) //p
		paused = !paused;
}
 
document.onkeyup = function(event){
        if(event.keyCode === 32){
		music.play()
                player.performAttack();
        }
        if(event.keyCode === 68)        //d
                player.pressingRight = false;
        else if(event.keyCode === 83)   //s
                player.pressingDown = false;
        else if(event.keyCode === 65) //a
                player.pressingLeft = false;
        else if(event.keyCode === 87) // w
                player.pressingUp = false;
}
 
update = function(){
        if(paused){
	 ctx.fillText('Paused',WIDTH/2,HEIGHT/2);
	 music.pause();
	 return;
	}
        ctx.clearRect(0,0,WIDTH,HEIGHT);
        Maps.current.draw();
        frameCount++;
	score++;
	
        Bullet.update();
	Upgrade.update();
	Enemy.update();
	
	
	player.update();
	
	ctx.fillText(player.hp + " Hp",0,30);
	ctx.fillText('Score: ' + score,200,30);
}
       

 
startNewGame = function(){
	interval = setInterval(update,40);
	// music.play()
        player.hp = 50;
        timeWhenGameStarted = Date.now();
        frameCount = 0;
        score = 0;
        Enemy.list = {};
        Upgrade.list = {};
	Bullet.list = {};
	music.currentTime = 0;
	gameOn = true;
	
        Enemy.randomlyGenerate();
        Enemy.randomlyGenerate();
	Enemy.randomlyGenerate();
	Enemy.randomlyGenerate();
        Enemy.randomlyGenerate();
	Enemy.randomlyGenerate();
	Enemy.randomlyGenerate();
        Enemy.randomlyGenerate();
	Enemy.randomlyGenerate();
	Enemy.randomlyGenerate();
        Enemy.randomlyGenerate();
	Enemy.randomlyGenerate();
       
}

let music = new Audio()
 music.src = sound.play
 music.loop = true;
 music.currentTime = 0

 let gameOverSound = new Audio()
 gameOverSound.src = sound.over
 gameOverSound.currentTime = 0

 
Maps = function(id,imgSrc,width,height){
	let self = {
		id:id,
		image:new Image(),
		width:width,
		height:height	
	}
	self.image.src = imgSrc;
	
	
	self.draw = function(){
		var x = WIDTH/2 - player.x;
		var y = HEIGHT/2 - player.y;
                ctx.drawImage(self.image,0,0,self.image.width,self.image.height,x,y,self.image.width*1.4,self.image.height*2
                        );
	}
	return self;
}



function gameOver() {
	clearInterval(interval)
	gameOn = false
	music.pause()
	gameOverSound.play()
	ctx.font = "40px Avenir"
	ctx.fillStyle = "red"
	ctx.fillText("GAME OVER", 300,200)
	ctx.fillStyle = "black"
	ctx.fillText("You Lose! Your score : " + score, 170,240)
	ctx.fillText("Player 2 press space bar", 220,340)

      }

Maps.current = Maps('field',"./img/map.jpg",1380,1100);





player = Player();
startNewGame();

 

addEventListener('keydown', e=> {
	switch (e.keyCode){
	  case 32:
	  if(!gameOn) startNewGame()
	  gameOverSound.src = sound.over;
	  music.pause()
	}
	
      })
