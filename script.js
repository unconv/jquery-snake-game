class Game
{
    constructor() {
        this.element = $('<div class="game"></div>');
        $("body").append( this.element );

        this.game_over_overlay = $('<div class="game-over"><div class="wrapper"><h1>GAME OVER</h1><div class="score">Score: <span class="score-number">0</span></div><a href="#" class="play-again">Play again</a></div></div>');
        this.element.append( this.game_over_overlay );
        this.game_over_overlay.hide();

        this.score_element = $('<div class="current-score">Score: <span class="score-number">0</span></div>');
        this.element.append( this.score_element );

        this.highscore_element = $('<div class="current-highscore">Highscore: <span class="highscore-number">0</span></div>');
        this.element.append( this.highscore_element );
        this.show_highscore();

        this.bind_buttons();

        this.width = 500;
        this.height = 500;

        this.score = 0;

        this.snakes = [];
    }

    bind_buttons() {
        $(document).on( "click", ".play-again", function() {
            this.reset_game();
            return false;
        }.bind( this ) );
    }

    reset_game() {
        this.game_over_overlay.slideUp();

        this.snakes.forEach( function( snake ) {
            snake.start();
            snake.reset_position();
            snake.reset_tail();
        } );

        this.score = 0;
        this.show_score();
        this.show_highscore();
    }

    add_snake( snake ) {
        this.element.append( snake.element );
        this.snakes.push( snake );
    }

    game_over() {
        this.snakes.forEach( function( snake ) {
            snake.stop();
        } );

        this.game_over_overlay.slideDown();

        if( this.score > this.get_highscore() ) {
            this.set_highscore( this.score );
        }
    }

    add_score() {
        this.score++;
        this.show_score();
    }

    show_score() {
        this.element.find( ".score-number" ).text( this.score );
    }

    show_highscore() {
        this.element.find( ".highscore-number" ).text( this.get_highscore() );
    }

    get_highscore() {
        return Number( localStorage.getItem( "snake_highscore" ) );
    }

    set_highscore( score ) {
        localStorage.setItem( "snake_highscore", score );
    }
}

class Snake {
    constructor( game ) {
        this.element = $('<div class="snake"><div class="eye1"></div><div class="eye2"></div></div>');
        this.game = game;
        game.add_snake( this );

        this.x = 240;
        this.y = 240;

        this.angle = 0;
        this.speed = 5;

        this.size = 20;

        this.stopped = false;

        this.tail = [];
        this.position_history = [];

        this.set_interval();
        this.bind_arrow_keys();
        this.init_tail();
        this.add_food();
    }

    add_food() {
        this.food = new Food( this );
    }

    reset_position() {
        this.x = 240;
        this.y = 240;

        this.angle = 0;
        this.speed = 5;

        this.size = 20;
    }

    reset_tail() {
        this.tail.forEach( function( tail ) {
            tail.remove();
        } );

        this.tail = [];
        this.position_history = [];

        this.init_tail();
    }

    start() {
        this.stopped = false;
    }

    stop() {
        this.stopped = true;
    }

    check_tail_collision() {
        this.tail.forEach( function( tail, index ) {
            if( index > 0 ) {
                if( tail.hits_snake() ) {
                    this.game.game_over();
                }
            }
        }.bind( this ) );
    }

    init_tail() {
        let starting_tail = 10;
        for( let i = 0; i < starting_tail; i++ ) {
            this.add_tail();
        }
    }

    add_tail() {
        let tail = new Tail( this );
        this.tail.push( tail );
    }

    position_tails() {
        let tail_positions = [];
        let position_count = 0;
        for( let i = this.position_history.length-1; i > 0; i-- ) {
            position_count++;
            if( tail_positions.length < this.tail.length ) {
                if( position_count > 5 ) {
                    tail_positions.push( this.position_history[i] );
                    position_count = 0;
                }
            } else {
                this.position_history.splice( i, 1 );
            }
        }

        this.tail.forEach( function( tail, index ) {
            if( typeof tail_positions[index] !== "undefined" ) {
                tail.move( tail_positions[index] );
            }
        } );
    }

    set_interval() {
        setInterval( function() {
            this.draw();
        }.bind( this ), 50 );
    }

    draw() {
        if( this.stopped ) {
            return false;
        }

        this.calculate_direction();
        this.check_overflow();
        this.position_tails();
        this.check_tail_collision();
        this.element.show();
        this.check_food();

        this.element.css({
            left: this.x,
            top: this.y,
        });

        this.position_history.push({
            x: this.x,
            y: this.y,
        });

    }

    check_food() {
        if( this.eats_food() ) {
            this.game.add_score();
            this.food.remove();
            this.add_food();
        }
    }

    eats_food() {
        return ( this.x < this.food.x + this.food.size && this.x + this.size > this.food.x && this.y < this.food.y + this.food.size && this.y + this.size > this.food.y );
    }

    bind_arrow_keys() {
        $(document).on( "keydown", function( event ) {
            if( event.keyCode == 37 ) {
                this.change_angle( -5 );
            } else if( event.keyCode == 39 ) {
                this.change_angle( 5 );
            }
        }.bind( this ) );
    }

    change_angle( degrees ) {
        this.angle += degrees;

        if( this.angle > 359 ) {
            this.angle = 0;
        }

        if( this.angle < 0 ) {
            this.angle = 359;
        }

        this.element.css({
            transform: "rotate("+this.angle+"deg)"
        });
    }

    calculate_direction() {
        let x_speed = this.speed;
        let y_speed = this.speed;
        let x_direction = 0;
        let y_direction = 0;

        if( this.angle >= 0 && this.angle <= 180 ) {
            if( this.angle <= 90 ) {
                let percentage = this.angle / 90;
                x_speed = this.speed * percentage;
            } else if( this.angle > 90 ) {
                let percentage = ( this.angle - 90 ) / 90;
                x_speed = this.speed * ( 1 - percentage );
            }
            x_direction = 1;
        } else if( this.angle > 180 && this.angle < 360 ) {
            if( this.angle <= 270 ) {
                let percentage = ( this.angle - 180 ) / 90;
                x_speed = this.speed * percentage;
            } else if( this.angle > 270 ) {
                let percentage = ( this.angle - 180 - 90 ) / 90;
                x_speed = this.speed * ( 1 - percentage );
            }
            x_direction = -1;
        }

        if( this.angle >= 90 && this.angle < 270 ) {
            if( this.angle <= 180 ) {
                let percentage = ( this.angle - 90 ) / 90;
                y_speed = this.speed * percentage;
            } else if( this.angle > 180 ) {
                let percentage = ( this.angle - 180 ) / 90;
                y_speed = this.speed * ( 1 - percentage );
            }
            y_direction = 1;
        } else if( this.angle >= 270 && this.angle < 360 ) {
            let percentage = ( this.angle - 270 ) / 90;
            y_speed = this.speed * percentage;
            y_direction = -1;
        } else if( this.angle >= 0 && this.angle < 90 ) {
            let percentage = this.angle / 90;
            y_speed = this.speed * ( 1 - percentage );
            y_direction = -1;
        }

        this.x += x_speed * x_direction;
        this.y += y_speed * y_direction;
    }

    check_overflow() {
        if( this.x + this.size < 0 ) {
            this.x = this.game.width;
        }

        if( this.x > this.game.width ) {
            this.x = -this.size;
        }

        if( this.y > this.game.height ) {
            this.y = -this.size;
        }

        if( this.y + this.size < 0 ) {
            this.y = this.game.height;
        }
    }
}

class Tail {
    constructor( snake ) {
        this.snake = snake;
        this.element = $('<div class="tail"></div>');
        this.snake.game.element.append( this.element );
        this.size = 20;

        this.x = 0;
        this.y = 0;
    }

    remove() {
        this.element.remove();
    }

    move( position ) {
        this.element.show();
        this.element.css({
            left: position.x,
            top: position.y,
        });

        this.x = position.x;
        this.y = position.y;
    }

    hits_snake() {
        return ( this.x < this.snake.x + this.snake.size && this.x + this.size > this.snake.x && this.y < this.snake.y + this.snake.size && this.y + this.size > this.snake.y );
    }
}

class Food {
    constructor( snake ) {
        this.snake = snake;
        this.element = $('<div class="food"></div>');
        this.snake.game.element.append( this.element );

        this.size = 20;

        this.x = Math.ceil( Math.random() * ( this.snake.game.width - this.size ) );
        this.y = Math.ceil( Math.random() * ( this.snake.game.height - this.size ) );

        this.draw();
    }

    draw() {
        this.element.css({
            left: this.x,
            top: this.y,
        })
    }

    remove() {
        this.element.remove();
    }
}

const game = new Game();
const snake = new Snake( game );

