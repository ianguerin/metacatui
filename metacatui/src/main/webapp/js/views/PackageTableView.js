define(['jquery', 'underscore', 'backbone', 'models/PackageModel', 'text!templates/downloadContents.html', 'text!templates/downloadButton.html'], 				
	function($, _, Backbone, Package, Template, DownloadButtonTemplate) {
	'use strict';

	
	var PackageTable = Backbone.View.extend({
		
		initialize: function(options){
			if((options === undefined) || (!options)) var options = {};
			
			this.packageId  = options.packageId	 || null;
			this.memberId	= options.memberId	 || null;
			this.attributes = options.attributes || null;
			this.className += options.className  || "";
			this.currentlyViewing = options.currentlyViewing || null;
			this.numVisible = options.numVisible || 4;
			this.numHidden = this.model.get("members").length - this.numVisible;
			this.parentView = options.parentView || null;
			
			//Set up the Package model
			if((typeof options.model === "undefined") || !options.model){
				this.model = new Package();
				this.model.set("memberId", this.memberId);
				this.model.set("packageId", this.packageId);
			}
			
			//Set up a listener for when the model is ready to work with
			//this.listenTo(this.model, "complete", this.render);
			
			//Get the members
			if(this.packageId)    this.model.getMembers();
			else if(this.memberId) this.model.getMembersByMemberID(this.memberId);
		},
		
		template: _.template(Template),
		
		downloadButtonTemplate: _.template(DownloadButtonTemplate),
		
		tagName : "div",
		
		className : "download-contents",
		
		events: {
			"click  .preview"         : "previewData",
			"click .expand-control"   : "expand",
			"click .collapse-control" : "collapse"
		},
		
		/*
		 * Creates a table of package/download contents that this metadata doc is a part of
		 */
		render: function(){
			var view = this,
				members = this.model.get("members");
			
			//If the model isn't complete, we may be still waiting on a response from the index so don't render anything yet
			if(!this.model.complete) return false;

			// Grab all of our URLs
			var queryServiceUrl   = appModel.get('queryServiceUrl');
			var packageServiceUrl = appModel.get('packageServiceUrl');
			var objectServiceUrl  = appModel.get('objectServiceUrl');
			
			var readsEnabled = false;

			//Does a route to an EML info page exist? If not, don't insert any links to EML info
			var routes = Object.keys(uiRouter.routes),
				EMLRoute = false;
			for(var i=0; i<routes.length; i++){
				if(routes[i].indexOf("tools") > -1){
					EMLRoute = true;
					i = routes.length;
				}
			}
			
			//Start the HTML for the rows
			var	tbody = $(document.createElement("tbody"));
		
			//Create the HTML for each row
			_.each(members, function(solrResult, i, members){
				
				var formatType = solrResult.get("formatType"),
					type       = solrResult.getType(),
					id		   = solrResult.get("id"),
					entityName = solrResult.get("entityName");
				
				//Use the metadata title instead of the ID
				if(!entityName && (formatType == "METADATA")) entityName = solrResult.get("title");

				//Display the id in the table if not name is present
				if((typeof entityName === "undefined") || !entityName) entityName = id;
				
				//Create a row for this member of the data package
				var tr = $(document.createElement("tr"));
				
				//Icon cell (based on formatType)
				var iconCell = $(document.createElement("td")).addClass("format-type"),
					formatTypeIcon = document.createElement("i"),
					icon = "icon-table";
				
				//Determine the icon type based on format id
				if(type == "program")
					icon = "icon-code";
				else if(type == "data")
					icon = "icon-table";
				else if(type == "metadata")
					icon = "icon-file-text";
				else if (type == "image")
					icon = "icon-picture";
				else if (type == "pdf")
					icon = "icon-file pdf";
				
				$(formatTypeIcon).addClass(icon);
				$(iconCell).html(formatTypeIcon);
				$(tr).append(iconCell);
				
				
				//Name cell
				var nameCell = $(document.createElement("td")).addClass("name wrap-contents");				
				var nameLink = document.createElement("a");
				$(nameLink).attr("href", objectServiceUrl + encodeURIComponent(id))
						  .text(entityName);
				$(nameCell).html(nameLink);
				$(tr).append(nameCell);

				//Format type cell
				var fileTypeCell = $(document.createElement("td")).addClass("formatId wrap-contents");				
				var fileTypePopover = "";
				var fileType = solrResult.get("formatId");
				if(fileType.substr(0, 3) == "eml"){
					//If the file type is EML, we may want to show a popover element for more info
					if(EMLRoute) fileType = '.xml <a href="#tools/eml">(EML ' + fileTypePopover + ')</a>';
					else         fileType = ".xml (EML" + fileTypePopover + ")";
				}
				else if(fileType == "application/pdf") fileType = "PDF"; //Friendlier-looking...
				$(fileTypeCell).html(fileType);
				$(tr).append(fileTypeCell);
				
				//File size cell
				var sizeCell = $(document.createElement("td")).addClass("size");
				var size = view.bytesToSize(solrResult.get("size"));
				$(sizeCell).text(size);
				$(tr).append(sizeCell);

				//The number of reads/downloads cell
				var reads = solrResult.get("read_count_i");
				var readsCell = $(document.createElement("td")).addClass("downloads");				
				$(tr).append(readsCell);
				if((typeof reads !== "undefined") && reads){ 
					if(formatType == "METADATA") reads += " views";
					else 						 reads += " downloads";
					$(readsCell).text(reads);
					readsEnabled = true;
				}
				else readsEnabled = false;
				
				//Download button cell
				var downloadBtnCell = $(document.createElement("td")).addClass("download-btn btn-container");				
				var downloadButtonHTML = view.downloadButtonTemplate({ href: objectServiceUrl + encodeURIComponent(id) });
				$(downloadBtnCell).append(downloadButtonHTML);
				$(tr).append(downloadBtnCell);
				
				//"Metadata" button cell
				if(members.length > 1){
					var moreInfoCell = $(document.createElement("td")).addClass("more-info btn-container");
					var moreInfo     = $(document.createElement("a"))
										.attr("href", "#view/" + id)
										.addClass("btn preview")
										.attr("data-id", id)
										.text("Metadata");
					var moreInfoIcon = $(document.createElement("i"))
										.addClass("icon icon-info-sign");
					$(moreInfo).append(moreInfoIcon);					
					$(moreInfoCell).append(moreInfo);
					$(tr).append(moreInfoCell);
				}
				
				//If we are already viewing this object, display the button as disabled with a tooltip
				if(view.currentlyViewing == solrResult.get("id")){
					$(moreInfo).attr("disabled", "disabled").tooltip({
						title: "You are currently viewing this",
						trigger: "hover focus"
					});
					
					//List this row first if it is the current item
					$(tbody).prepend(tr);
				}
				else
					//Add this row to the table body
					$(tbody).append(tr);
			});
			
			//After all the rows are added, hide the first X rows. We wait until after all rows are added because their order may be changed around during rendering.
			var bodyRows = $(tbody).find("tr");
			if(bodyRows.length > this.numVisible)
				//Get the first X rows
				$(_.last(bodyRows, this.numHidden)).addClass("collapse").css("display", "none"); 
			
			//Draw the footer which will have an expandable/collapsable control
			if(this.numHidden > 0){
				var tfoot        = $(document.createElement("tfoot")),
					tfootRow     = $(document.createElement("tr")),
					tfootCell    = $(document.createElement("th")).attr("colspan", 7),
					expandLink   = $(document.createElement("a")).addClass("expand-control control").text("View " + this.numHidden + " more"),
					expandIcon   = $(document.createElement("i")).addClass("icon-expand-alt"),
					collapseLink = $(document.createElement("a")).addClass("collapse-control control").text("View less").css("display", "none"),
					collapseIcon = $(document.createElement("i")).addClass("icon-collapse-alt");

				$(tfoot).append(tfootRow);
				$(tfootRow).append(tfootCell);
				$(tfootCell).append(expandLink, collapseLink);
				$(expandLink).append(expandIcon);
				$(collapseLink).append(collapseIcon);
			}
			
			//Draw and insert the HTML table
			var downloadButtonHTML = "";
			if(packageServiceUrl){
				downloadButtonHTML = this.downloadButtonTemplate({ 
					href: packageServiceUrl + encodeURIComponent(this.model.get("id")), 
					text: "Download all",
					className: "btn btn-primary "
				});	
			}
			this.$el.append(this.template({
				downloadButton: downloadButtonHTML,
				readsEnabled: readsEnabled
			}));
			
			//Add the table body and footer
			this.$("thead").after(tbody);
			if(typeof tfoot !== "undefined") this.$(tbody).after(tfoot);
			
			return this;
		},
		
		/**
		 * When the "Metadata" button in the table is clicked while we are on the Metadata view, 
		 * we want to scroll to the anchor tag of this data object within the page instead of navigating
		 * to the metadata page again, which refreshes the page and re-renders (more loading time)
		 **/
		previewData: function(e){
			//Don't go anywhere yet...
			e.preventDefault();
			
			if(this.parentView){
				if(this.parentView.previewData(e))
					return;
			}
			
			//Get the target of the click
			var button = $(e.target);
			if(!$(button).hasClass("preview")) 
				button = $(button).parents("a.preview");
			if(button.length < 1) 
				button = $(button).parents("[href]");
			
			//If we are on the Metadata view, then let's scroll to the anchor
			var id = $(button).attr("data-id");
			var anchor = $("#" + id.replace(/(:|\.|\[|\]|,|\(|\)|\/|\\)/g, "-"));
			
			if(anchor.length) appView.scrollTo(anchor);
			else window.location = $(button).attr("href");  //navigate to the link href
		},
		
		expand: function(e){
			//Don't do anything...
			e.preventDefault();
			
			var view = this;

			this.$("tr.collapse").fadeIn();
			this.$(".expand-control").fadeOut(function(){
				view.$(".collapse-control").fadeIn();				
			});
		},
		
		collapse: function(e){
			//Don't do anything...
			e.preventDefault();
			
			var view = this;

			this.$("tr.collapse").fadeOut();
			this.$(".collapse-control").fadeOut(function(){
				view.$(".expand-control").fadeIn();				
			});			
		},
		
		/**
		 * Convert number of bytes into human readable format
		 *
		 * @param integer bytes     Number of bytes to convert
		 * @param integer precision Number of digits after the decimal separator
		 * @return string
		 */
		bytesToSize: function(bytes, precision){  
		    var kilobyte = 1024;
		    var megabyte = kilobyte * 1024;
		    var gigabyte = megabyte * 1024;
		    var terabyte = gigabyte * 1024;
		   
		    if ((bytes >= 0) && (bytes < kilobyte)) {
		        return bytes + ' B';
		 
		    } else if ((bytes >= kilobyte) && (bytes < megabyte)) {
		        return (bytes / kilobyte).toFixed(precision) + ' KB';
		 
		    } else if ((bytes >= megabyte) && (bytes < gigabyte)) {
		        return (bytes / megabyte).toFixed(precision) + ' MB';
		 
		    } else if ((bytes >= gigabyte) && (bytes < terabyte)) {
		        return (bytes / gigabyte).toFixed(precision) + ' GB';
		 
		    } else if (bytes >= terabyte) {
		        return (bytes / terabyte).toFixed(precision) + ' TB';
		 
		    } else {
		        return bytes + ' B';
		    }
		}
	});
	
	return PackageTable;

});