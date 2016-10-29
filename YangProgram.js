var express = require('express');
var app = express();

//fs file reader
var fs = require('fs');

//set handlebar , 添加section用于防止单独的元素
var handlebars = require('express-handlebars').create({
	defaultLayout:'main',
	helpers:{
		section:function(name,options){
			if(!this._sections) this._sections = {};
			this._sections[name] = options.fn(this);
			return null;
		}
	}});
app.engine('handlebars',handlebars.engine);
app.set('view engine','handlebars');

//设置端口
app.set('port',process.env.PORT || 3000);

app.use(express.static(__dirname+'/public'));

//开发者测试页面
app.use(function(req,res,next){
	res.locals.showTests = app.get('env') !== 'production' && req.query.test === '1';
	next();
});


//首页
app.get('/',function(req,res){
	// 采用默认布局或者指定布局
	// res.render('home',{layout:'microLayout'})
  	res.render('home');
});

//提供天气信息的中间件
var weather = require('./lib/weather.js');	
app.use(function(req, res, next){
	if(!res.locals.partials) res.locals.partials = {}; 
	res.locals.partials.weather = weather.getWeatherDate(); 
	next(); 	
});


//请求头
app.get('/headers',function(req,res){
	app.set('Content-Type','text/plain');
	var s ='';
	for(var name in req.headers) s+=name+':'+req.headers[name]+'\n';
	res.send(s);
});

//表单处理
app.use(require('body-parser').urlencoded({ extended: true }));
// app.use(bodyParser.urlencoded({ extended: true }));

app.get('/newsletter',function(req,res){
	res.render('newsletter',{csrf:'CSRF token goes here.'})
});

app.post('/process',function(req,res){
	console.log('From (from querystring):'+req.query.form)
	console.log('CSRF token (from hidden form field):'+req.body._csrf);
	console.log('NAME (from visible form field):'+req.body.name);
	console.log('EMAIL (from visible form field):'+req.body.email);
	res.redirect(303,'/thank-you');
});

//upload a file
var formidable = require('formidable');

app.get('/contest/vacation-photo',function(req,res){
	var now = new Date();
	res.render('contest/vacation-photo',{year:now.getFullYear(),month:now.getMonth()});
});

app.post('/contest/vacation-photo/:year/:month',function(req,res){
	var form = new formidable.IncomingForm();
	form.parse(req,function(err,fields,files){
		if(err){
			return res.redirect(303,'/error');
		}
		console.log('receive fields:');
		console.log(fields);
		console.log('receive files:');
		console.log(files);
		res.redirect(303,'/thank-you');
	});
});

//thank-you page
app.get('/thank-you',function(req,res){
	res.render('thank-you');
});

//section test
app.get('/jquerytest',function(req,res){
	res.render('jquerytest');
});

//动态显示结果
var fortune = require('./lib/fortune.js');
app.get('/about',function(req,res){
  res.render('about',{
  	fortune:fortune.getFortune(),
  	pageTestScript:'/qa/tests-about.js'
  });
});

// session使用 即显消息
app.use(require('body-parser')(credentials.cookieSecret));
app.use(require('express-session')());

app.use(function(req,res,next){
	// 如果有即显消息，则传到上下文，然后删除
	res.locals.flash = req.session.flash;
	delete req.session.flash;
	next();
});

app.post('/newsletter',function(req,res){
	var name = req.body.name || '',email = req.body.email || '';
	//输入验证
	if(!email.match(VALID_EMAIL_REGEX)){
		if (req.xhr) {
			return res.json({error: 'Invalid name email address.'});
		}
		req.session.flash = {
			type:'danger',
			intro:'Validation error!',
			message:'The email address you entered was not valid.',
		};
		return res.redirect(303,'/newsletter/archive');
	}

	new NewsletterSignup({name:name,email:email}).save(function(err){
		if(err){
			if (req.xhr) {
				return res.json({error:'Database error.'});
			}
			req.session.flash = {
				type:'danger',
				intro:'Database error!',
				message:'There was a Database error ; please try again later.',
			}
			return res.redirect(303,'/newsletter/archive');
		}
	});
});


//404 catch-all 处理器中间件
app.use(function(req,res,next){
  res.status(404);
  res.render('404');
});
//500 错误处理中间件
app.use(function(err,req,res,next){
  console.error(err.stack);
  res.status(500);
  res.render('500');
});

app.listen(app.get('port'),function(){
  console.log('Express started on http://localhost:'+app.get('port')+';press Ctrl-C to terminate.');
});