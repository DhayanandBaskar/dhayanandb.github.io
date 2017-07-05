(function() {
	//MODEL:[DATA HUB][Never directly interacts with VIEW]
	var model = {
			//JSON stored as session component to avoid hitting URL every time
			books: {},
			objectSortStyle: 'default',//Sorting Style
			localStorageAvailable: true,
			totalBooks : 0,
			bookMarks: [],
			init: function() {
					var index = 0;
					var apiUrl = 'https://capillary.0x10.info/api/books?type=json&query=list_books';
					$.getJSON(apiUrl, function(data) {
						//Remove JSON objects with null values
						model.books = $.map( data.books, function( book ) {
							var val = _.values(book),
							withoutNull = _.without(val, null),
							likesArray = model.likes;
							if ( val.length == withoutNull.length) {
								//adding additional key value pairs
								var btnId = "bt"+ index,
									strId = "st" + index,
									id = index,
									pricedAt = parseInt(book.price);
									++index;
								return _.extend(book, {buttonId: btnId, id: id,pricedAt:pricedAt, starRating :strId});								
							}
							else {
								return ;
							}				
						});	
						model.totalBooks = index;
						//initiate PROMISE if successfully reached this point
						controller.promiseTrigger();
					}).error(function(e){
						//In case of error
				    	controller.reportError();
				    });
				}
	};
	//CONTROLLER [Contains Utility methods][Acts as an interface between MODEL and VIEW]
	 var controller = {
			 //SORT by Rating
			 getsortedByRating: function() {
				 var books = model.books.sort(function(a, b) {
						var x = a.rating, y = b.rating;
						return x < y ? 1 : x > y ? -1 : 0;
						});
				 return books;
			 },
			//SORT by Likes
			 getsortedsortByLikes: function() {
				 var books = model.books.sort(function(a, b) {
						var x = parseInt(a.price), y = parseInt(b.price);
						return x < y ? 1 : x > y ? -1 : 0;
						});
				 return books;;
			 },
			 //Returning sorted Object based on Criteria
			 getobjectSortStyle: function() {
				 if(model.objectSortStyle == "sortbyPrice"){
					 var obj = controller.getsortedsortByLikes();
					 return obj;
				 }
				 else if(model.objectSortStyle == "sortbyRating") {
					 var obj = controller.getsortedByRating();
					 return obj;
				 }
				 else if(model.objectSortStyle == "default") {
					 return model.books;
				 }
			 },
			 //Setting Sorting Criteria
			 setobjectSortStyle: function(sortOrder) {
				 model.objectSortStyle = sortOrder;
				 var obj = controller.getobjectSortStyle()
				 view.render(obj);
			 },
			 //Check if LocalStorage is available
			 isLocalStorageAvailable: function () {
				 if(window.localStorage) {
					    model.localStorageAvailable = true;
					} else {
						 model.localStorageAvailable = false;
					}
			 },
			 //Getting total books
			 getTotlaBooks: function() {
				 return model.totalBooks
			 },
			 //Setting Local Storage [BOOKMARKS ARE CONVERTED INTO AN STRING AND THEN STORED]
			 setLocalStorageLikesDetails: function() {
				 if(model.localStorageAvailable) {
					 localStorage.removeItem('bookmark');
					 var storage = model.bookMarks.join();
					 localStorage.setItem('bookmark', storage);
				 }
			 },
			 //Fetching Local Storage [BOOKMARKS LOCAL STRING IS FETCHED AND CONVERTED INTO ARRAY]
			initializeBookMarks: function() {
					if(model.localStorageAvailable) {
						 if (localStorage.getItem('bookmark') != null){
							 var str = localStorage.getItem('bookmark');
							  model.bookMarks = str.split(",");
							}else{	
								var list = [];
							    for(i = 0; i<20; i++){
							    	list.push(0);
							    }
							    list = list.slice(0, model.totalBooks);
							    model.bookMarks = list;
							}
					 }
				},
				//SET Bookmark
			 setBookmark: function(index) {
				 var chker = model.bookMarks[index];
				 chker == 0? chker = 1 : chker = 0;
				 model.bookMarks[index] = chker;
				 controller.setLocalStorageLikesDetails();
			 },
			 //GET Total Bookmark
			 getTotalBookMarks: function() {
				 var totalbkm=0;
				 var arr= controller.getbookMarkArray();
				 $.each(arr, function( index, value ) {
					 if(value == 1){
						 totalbkm++;
					 } 
				 });
				 return totalbkm;
			 },
			 //GET the Entire JSON
			 getFullJSON :  function() {
				 return model.books;
			 },
			 //GET the Array of Bookmarks
			 getbookMarkArray : function() {
				 return model.bookMarks;
			 },
			 //GET the Rating as array
			 getRatingAsArray : function(index) {
				 var rate = [];
				 $.each(model.books, function( index, value ) {
					 rate.push(model.books[index].rating);
				 });
				 return rate;
			 },
			 //ERROR Reporter
			 reportError : function(){
				 view.jsonReqFailed();
			 },
			 //Initiation
			 init: function() {
				 model.init();	
				 view.javascriptChecker();
			 },
			 //PROMISE FRAMEWORK STYLE:  Listening to Async request
			 promiseTrigger: function(){
				 controller.initializeBookMarks();
				 controller.setLocalStorageLikesDetails();
				 view.init();				 
			 }

	 };
	 //VIEW [Takes Care of the rendering and event listening features] [Never Directly interacts with model]
	 var view = {
			 //Error Handling
			 javascriptChecker: function() {
				 $('#jsFailed').hide(); // Message is shown if JavaScript is not available or is disabled
			 },
			 jsonReqFailed: function() {
				 $('#jsFailed').show(); // In case of JSON Request failed
				 $('#jsFailed').text("JSON REQUEST FAILED, SORRY")
			 },
			 init: function() {
				 var obj = controller.getobjectSortStyle();
				 view.render(obj);
				 var completeJson = controller.getFullJSON();
				 view.renderModelOnce(completeJson);
				 view.listenToSortOrder();
				 view.searchOperation();
			 },
			 render: function(books) {
				 	var template = $('#contentTemplate').html();					
					var compiled = Handlebars.compile(template),
					 rendered = compiled(books);
					
				$('#content').html('');
				$('#content').append(rendered);
				//Attaching Event Listeners and Rendering Units 
				
				view.setTotalBooks();
				
				var arr = controller.getbookMarkArray();
				view.updateBookMark(arr);
				view.setTotalBookMarks();
				var rateArr = controller.getRatingAsArray();
				view.displayRating(rateArr);
                                view.listenToBookMark();
			 },
			 //rendering Models
			 renderModelOnce: function(compJson) {
				 var template = $('#moduleTemplate').html();					
				 var compiled = Handlebars.compile(template),
				  rendered = compiled(compJson);
					
				$('#modelHolder').append(rendered);
			 },
			 //Rendering Interactive Star rating
			 displayRating: function(rateArr) {
				 $.each(rateArr, function( index, value ) {
					 
						 $('#st'+index).rateYo({
								starWidth : "20px",
								ratedFill: "#E74C3C",
								rating: value
							}); 
					});
			 }, 
			 // LIVE SEARCH
			 searchOperation: function() {
				 var completeJson = controller.getFullJSON();
				 $('#search').keyup(function(){
					 var searchField = $('#search').val();
			         var regex = new RegExp(searchField, "i");
			         var searchJson = $.grep( completeJson , function( obj, index){
			        	 if ((obj.name.search(regex) != -1) || (obj.author.search(regex) != -1) || (obj.rating.search(regex) != -1)) {
			        		 return obj;
			        	 }
			        	 else {
			        		 return;
			        	 }
			         });
			         //OPTIMIZATION - ONLY CALLED AFTER 800 HITS TO AVOID CLUTTRING - keyup event can fire many time than required!
			         //underscore js defer will render in chunks without blocking the UI thread from updating
			         _.throttle(_.defer(_.after(10, view.render(searchJson))), 2000);
				 });
				 
			 },
			 //Render Total Books
			 setTotalBooks: function() {
				 var totalBooks = controller.getTotlaBooks();
				 $('#totalBook').html('');
				 $('#totalBook').append(totalBooks);
			 },
			//Render Total bookmarks
			 setTotalBookMarks: function() {
				 var totalBookMarks = controller.getTotalBookMarks();
				 $('#totalBookmark').html('');
				 $('#totalBookmark').append(totalBookMarks);
			 },
			 //SORTING FEATURE
			 listenToSortOrder: function() {
				 $('#sortOptionsPanel input').on('click', function(e){
					 
					var clickedOption = e.target.id,
					sorterData = $('#'+clickedOption).data('sort');

					controller.setobjectSortStyle(sorterData);
				 });
			 },
			 //INITIAL RENDERING OF BOOKMARKS FROM LOCALSTORAGE
			 updateBookMark: function(arr) {
				 var btnUp = arr;
					 $.each(btnUp, function( index, value ) {
						 if(value == 1){
							 $('#bt'+index).removeClass('glyphicon-star-empty'); 
							 $('#bt'+index).addClass('glyphicon-star');
						 } 
						});
			 },
			 //LISTEN TO BOOKMARK CLICKS AND UPDATE THE ICON
			 listenToBookMark: function() {
				 $('.btn-primary').on('click', function(e){
					var clickedOption = e.target.id,
					index = $('#'+clickedOption).data('index');
					controller.setBookmark(index);
					var id = $('#'+clickedOption);
					id.hasClass('glyphicon-star-empty') ? (id.removeClass('glyphicon-star-empty') , id.addClass('glyphicon-star')) : (id.removeClass('glyphicon-star') , id.addClass('glyphicon-star-empty'));
					view.setTotalBookMarks();
				 });
			 }

	 };
	 	 //IT ALL BIGINS HERE
	 controller.init();
})();