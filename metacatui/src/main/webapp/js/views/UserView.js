/*global define */
define(['jquery', 'underscore', 'backbone', '../../components/zeroclipboard/ZeroClipboard.min', 'collections/UserGroup', 'models/UserModel', 'views/SignInView', 'views/StatsView', 'views/DataCatalogView', 'views/GroupListView', 'text!templates/userProfile.html', 'text!templates/alert.html', 'text!templates/loading.html', 'text!templates/userProfileMenu.html', 'text!templates/userSettings.html', 'text!templates/noResults.html'], 				
	function($, _, Backbone, ZeroClipboard, UserGroup, UserModel, SignInView, StatsView, DataCatalogView, GroupListView, userProfileTemplate, AlertTemplate, LoadingTemplate, ProfileMenuTemplate, SettingsTemplate, NoResultsTemplate) {
	'use strict';
	
	/*
	 * UserView
	 * A major view that displays a public profile for the user and a settings page for the logged-in user
	 * to manage their account info, groups, identities, and API tokens.
	 */
	var UserView = Backbone.View.extend({

		el: '#Content',
		
		//Templates
		profileTemplate:  _.template(userProfileTemplate),
		alertTemplate:    _.template(AlertTemplate),
		loadingTemplate:  _.template(LoadingTemplate),
		settingsTemplate: _.template(SettingsTemplate),		
		menuTemplate:     _.template(ProfileMenuTemplate),
		noResultsTemplate: _.template(NoResultsTemplate),
						
		events: {
			"click .section-link"          : "switchToSection",
			"click .subsection-link"       : "switchToSubSection",
			"click .token-generator"       : "getToken",
			"click #mod-save-btn"		   : "saveUser",
			"click #map-request-btn"	   : "sendMapRequest",
			"click .remove-identity-btn"   : "removeMap",
			"click .confirm-request-btn"   : "confirmMapRequest",
			"click .reject-request-btn"	   : "rejectMapRequest",
			"click [highlight-subsection]" : "highlightSubSection",
			"blur #add-group-name"         : "checkGroupName",
			"keypress #add-group-name"     : "preventSubmit",
			"click #add-group-submit"      : "createGroup"
		},
		
		initialize: function(){			
			this.subviews = new Array();
			this.activeSection = "profile";
			this.activeSubSection = "";
		},
		
		//------------------------------------------ Rendering the main parts of the view ------------------------------------------------//
		render: function () {			
			this.stopListening();
			
			//Add the container element for our profile sections
			this.sectionHolder = $(document.createElement("section")).addClass("user-view-section");
			this.$el.html(this.sectionHolder);
			
			//Show the loading sign first
			//$(this.sectionHolder).html(this.loadingTemplate());
			this.$el.show();
						
			// set the header type
			appModel.set('headerType', 'default');
			
			//Render the user profile only after the app user's info has been checked
			//This prevents the app from rendering the profile before the login process has completed - which would
			//cause this profile to render twice (first before the user is logged in then again after they log in)
			if(appUserModel.get("checked")) this.renderUser();
			else appUserModel.on("change:checked", this.renderUser, this);
				
			return this;
		},
		
		renderUser: function(){
			this.model = appUserModel;
			
			if(!appModel.get("userProfiles")){

				if(!this.model.get("loggedIn")){
					this.showAlert('You must be logged in to view your account settings.',
									"alert-warning",
									this.$el);
					
					//Insert the sign-in button
					var signInView = new SignInView().render();
					this.$el.append(signInView.el);
					signInView.setUpPopup();
					
					return;
				}
					
				this.renderSettings();
				this.resetSections();
			}
			else{
				var username = appModel.get("profileUsername"),
					currentUser = appUserModel.get("username") || "";
				
				if(username.toUpperCase() == currentUser.toUpperCase()){ //Case-insensitive matching of usernames
					this.model = appUserModel;
					
					//If the user is logged in, display the settings options
					if(this.model.get("loggedIn")){
						this.insertMenu();
						this.renderProfile();
						this.renderSettings();
						this.resetSections();
					}
				}
				
				//If this isn't the currently-looged in user, then let's find out more info about this account
				else{
					//Create a UserModel with the username given
					var user = new UserModel({
						username: username
					});
					this.model = user;	
					
					//When we get the infomration about this account, then crender the profile
					this.model.once("change:checked", this.renderProfile, this);
					this.model.once("change:checked", this.resetSections, this);
					//Get the info
					this.model.getInfo();
				}
			}	
		},
		
		/* COMMENTED OUT for now because it was possibly over-engineering the problem... But keeping this code just in case its usable in the future...
		 * the idea was to create an inherited view for groups that reuses a lot of the UserView code, but because it was tied to a collection (vs model) it was going to be a 
		 * lot of refactoring 
		 * -------
		 * Checks if the current model is a person or a group, and renders this UserView for people and the UsersGroupView for groups
		 */
/*		checkType: function(){
			//If this user is a group
			if(this.model.get("type") == "group"){
				var el = this.el;
				
				//Create a User Group collection
				var group = new UserGroup([], this.model.toJSON());
				//PUll in the UserGroupView, an inherited view, and render that
				require(["views/UserGroupView"], function(UserGroupView){
					var groupView = new UserGroupView({ collection: group });
					groupView.setElement(el);
					groupView.render();
				});
				
			}
			//For non-group (person) accounts, render the profile here
			else
				this.renderProfile();
		},*/	
		
		renderProfile: function(){
			
			//Insert the template first
			var profileEl = $.parseHTML(this.profileTemplate({
				type: this.model.get("type")
			}).trim());
			
			//If the profile is being redrawn, then replace it
			if(this.$profile && this.$profile.length){
				//If the profile section is currently hidden, make sure we hide our new profile rendering too
				if(!this.$profile.is(":visible"))
					$(profileEl).hide();
				
				this.$profile.replaceWith(profileEl);
			}
			//If this is a fresh rendering, then append it to the page and save it
			else
				this.sectionHolder.append(profileEl);
			
			this.$profile = $(profileEl);
						
			//If this user hasn't uploaded anything yet, display so
			this.listenTo(this.model.get("searchResults"), "reset", function(searchResults){
				if(searchResults.length == 0)
					this.noActivity();
			});
			
			//Insert the user data statistics
			this.insertStats();
			
			//Insert the user's basic information
			this.listenTo(this.model, "change:fullName", this.insertUserInfo);
			this.insertUserInfo();

			var view = this;
			//Listen to changes in the user's search terms
			this.listenTo(this.model, "change:searchModel", this.renderProfile);
			
			//Insert this user's data content
			this.insertContent();
			
			//List the groups this user is in
			if(this.model.get("type") == "group"){
				//Create the User Group collection
				var options = { 
					name: this.model.get("fullName"), 
					groupId: this.model.get("username"),
					rawData: this.model.get("rawData") || null 
					}
				var userGroup = new UserGroup([], options);
				
				//Create the group list and add it to the page
				var viewOptions = { collapsable: false, showGroupName: false } 
				var groupList = this.createGroupList(userGroup, viewOptions);
				this.$("#user-membership-container").html(groupList);
			}
			else{
				this.insertMembership();				
			}			
		},
		
		renderSettings: function(){
			//Insert the template first
			this.sectionHolder.append(this.settingsTemplate(this.model.toJSON()));
			this.$settings = this.$("[data-section='settings']");
			
			if(appModel.get("userProfiles")){
	
				//Draw the group list
				this.insertCreateGroupForm();
				this.listenTo(this.model, "change:isMemberOf", this.getGroups);
				this.getGroups();
				
				//Listen for the identity list
				this.listenTo(this.model, "change:identities", this.insertIdentityList);
				this.insertIdentityList();
				
				//Listen for the pending list
				this.listenTo(this.model, "change:pending", this.insertPendingList);
				this.model.getPendingIdentities();
				
				//Listen for updates to person details
				this.listenTo(this.model, "change:lastName change:firstName change:email change:registered", this.updateModForm);
				this.updateModForm();
	
				// init autocomplete fields
				this.setUpAutocomplete();
			}
			
			//Get the token right away
			this.getToken();
		},
		
		/*
		 * Displays a menu for the user to switch between different views of the user profile
		 */
		insertMenu: function(){

			//If the user is not logged in, then remove the menu 
			if(!appUserModel.get("loggedIn")){
				this.$(".nav").remove();
				return;
			}
			
			//Otherwise, insert the menu
			var menu = this.menuTemplate({
				username: this.model.get("username")
			});
			
			this.$el.prepend(menu);
		},

		//------------------------------------------ Navigating sections of view ------------------------------------------------//
		switchToSection: function(e, sectionName){
			
			if(e) e.preventDefault();
			
			//Hide all the sections first
			$(this.sectionHolder).children().slideUp().removeClass(".active");

			//Get the section name
			if(!sectionName)
				var sectionName = $(e.target).attr("data-section");
			
			//Display the specified section
			var activeSection = this.$(".section[data-section='" + sectionName + "']");
			if(!activeSection.length) activeSection = this.$(".section[data-section='profile']");
			$(activeSection).addClass("active").slideDown();
			
			//Change the navigation tabs
			this.$(".nav-tab").removeClass("active");
			$(".nav-tab[data-section='" + sectionName + "']").addClass("active");
			
			//Find all the subsections, if there are any
			if($(activeSection).find(".subsection").length > 0){
				//Find any item classified as "active"
				var activeItem = $(activeSection).find(".active");
				if(activeItem.length > 0){
					//Find the data section this active item is referring to
					if($(activeItem).children("[data-subsection]").length > 0){
						//Get the section name
						var subsectionName = $(activeItem).find("[data-subsection]").first().attr("data-subsection");
						//If we found a section name, find the subsection element and display it
						if(subsectionName) this.switchToSubSection(null, subsectionName);
					}
					else
						this.switchToSubSection(null, $(activeSection).children("[data-section]").first().attr("data-section"));
				}
			}
		},
		
		switchToSubSection: function(e, subsectionName){
			if(e){ 
				e.preventDefault();
			    var subsectionName = $(e.target).attr("data-section");
			}
						
			//Mark its links as active
			$(".section.active").find(".subsection-link").removeClass("active");
			$(".section.active").find(".subsection-link[data-section='" + subsectionName + "']").addClass("active");
			
			//Hide all the other sections
			$(".section.active").find(".subsection").hide();
			$(".section.active").find(".subsection[data-section='" + subsectionName + "']").show();
		},
		
		resetSections: function(){
			//Hide all the sections first, then display the section specified in the URL (or the default)
			this.$(".subsection, .section").hide();
			this.switchToSection(null, this.activeSection);
			
			//Show the subsection			
			if(this.activeSubSection)
				this.switchToSubSection(null, this.activeSubSection);
		},
		
		highlightSubSection: function(e, subsectionName){
			if(e) e.preventDefault();
			
			if(!subsectionName && e){
				//Get the subsection name
				var subsectionName = $(e.target).attr("highlight-subsection");
				if(!subsectionName) return;
			}
			else if(!subsectionName && !e) return false;
			
			//Find the subsection
			var subsection = this.$(".subsection[data-section='" + subsectionName + "']");
			if(!subsection.length) subsection = this.$("[data-subsection='add-account']");
			if(!subsection.length) return;
			
			//Visually highlight the subsection
			subsection.addClass("highlight");
			appView.scrollTo(subsection);
			//Wait about a second and then remove the highlight style
			window.setTimeout(function(){ subsection.removeClass("highlight"); }, 1500);
		},
		
		//------------------------------------------ Inserting public profile UI elements ------------------------------------------------//		
		insertStats: function(){
			if(this.model.noActivity && this.statsView){
				this.statsView.$el.addClass("no-activity");
				this.$("#total-upload-container").text("0");
				return;
			}
			
			var username = this.model.get("username"),
				view = this;
			
			//Insert a couple stats into the profile
			this.listenToOnce(statsModel, "change:firstUpload", this.insertFirstUpload);
			this.listenToOnce(statsModel, "change:totalUploads", function(statsModel){
				view.$("#total-upload-container").text(statsModel.get("totalUploads"));
			});
			
			//Create a base query for the statistics
			var statsSearchModel = this.model.get("searchModel").clone();
			statsSearchModel.set("exclude", [], {silent: true}).set("formatType", [], {silent: true});			
			statsModel.set("query", statsSearchModel.getQuery());
			statsModel.set("searchModel", statsSearchModel);
			
			//Render the Stats View for this person
			this.statsView = new StatsView({
				title: "",
				el: this.$("#user-stats")
			});
			this.subviews.push(this.statsView);
			this.statsView.render();
			if(this.model.noActivity)
				this.statsView.$el.addClass("no-activity");
		},
		
		/*
		 * Insert the name of the user
		 */
		insertUserInfo: function(){
			
			//Don't try to insert anything if we haven't gotten all the user info yet
			if(!this.model.get("fullName")) return;
			
			//Insert the name into this page
			this.$(".insert-fullname").text(this.model.get("fullName"));
			//Insert the username
			this.$(".insert-username").text(this.model.get("username"));
			if(this.model.isOrcid()) 
				this.$(".show-orcid").show();
			else
				this.$(".show-orcid").hide();
		},
		
		// Creates an HTML element to display in front of the user identity/subject. 
		// Only used for the ORCID logo right now
		createIdPrefix: function(){
			if(this.model.get("orcid") || this.model.isOrcid())
				return $(document.createElement("img")).attr("src", "./img/orcid_64x64.png").addClass("orcid-logo");
			else
				return "";
		},
		
		/*
		 * Insert the first year of contribution for this user
		 */
		insertFirstUpload: function(){
			if(this.model.noActivity || !this.model.get("searchResults").length){
				this.$("#first-upload-container, #first-upload-year-container").hide();
				return;
			}
			
			var firstUpload = new Date(statsModel.get("firstUpload"));
			
			var monthNames = [ "January", "February", "March", "April", "May", "June",
				                 "July", "August", "September", "October", "November", "December" ];
			
			var m = monthNames[firstUpload.getUTCMonth()],
				y = firstUpload.getUTCFullYear(),
				d = firstUpload.getUTCDate();
			
			this.$("#first-upload-container").text("Contributor since " + m + " " + d + ", " + y);
			this.$("#first-upload-year-container").text(y);
		},
		
		/*
		 * Insert a list of this user's content
		 */
		insertContent: function(){	
			if(this.model.noActivity){
				this.$("#data-list").html(this.noResultsTemplate({
					fullName: this.model.get("fullName"),
					username: ((this.model == appUserModel) && appUserModel.get("loggedIn"))? this.model.get("username") : null
				}));
				return;
			}
			
			var view = new DataCatalogView({
				el            : this.$("#data-list")[0],
				searchModel   : this.model.get("searchModel"),
				searchResults : this.model.get("searchResults"),
				mode          : "list",
				isSubView     : true,
				filters       : false
			});
			this.subviews.push(view);
			view.render();
			view.$el.addClass("list-only");
			view.$(".auto-height").removeClass("auto-height").css("height", "auto");
			$("#metacatui-app").removeClass("DataCatalog mapMode");
		}, 
		
		/*
		 * Inserts a list of groups this user is a member of 
		 */
		insertMembership: function(){			
			var groups = _.sortBy(this.model.get("isMemberOf"), "name");			
			if(!groups.length){
				this.$("#user-membership-header").hide();
				return;
			}
						
			var	model  = this.model,
				list   = $(document.createElement("ul")).addClass("list-group member-list"),
				listHeader = $(document.createElement("h5")).addClass("list-group-item list-group-header").text("Member of " + groups.length + " groups"),
				listContainer = this.$("#user-membership-container");
						
			_.each(groups, function(group, i){				
				var name = group.name || "Group " + i,
					listItem = $(document.createElement("li")).addClass("list-group-item"),
					groupLink = group.groupId? $(document.createElement("a")).attr("href", "#profile/" + group.groupId).text(name).appendTo(listItem) : "<a></a>";
				
				$(list).append(listItem);
			});
			
			listContainer.html(list);
			list.before(listHeader);
		},
		
		/*
		 * When this user has not uploaded any content, render the profile differently
		 */
		noActivity: function(){
			this.model.noActivity = true;
			this.insertContent();
			this.insertFirstUpload();
			this.insertStats();
		},
		
		//-------------------------------------------------------------- Groups -------------------------------------------------------//
		/*
		 * Gets the groups that this user is a part of and creates a UserGroup collection for each
		 */
		getGroups: function(){
			var view = this,
				groups = [];
			
			//Create a group Collection for each group this user is a member of
			_.each(_.sortBy(this.model.get("isMemberOf"), "name"), function(group){
				var userGroup = new UserGroup([view.model], group);
				groups.push(userGroup);

				view.listenTo(userGroup, "sync", function(){				
					var list = view.createGroupList(userGroup);
					this.$("#group-list-container").append(list);
				});
				userGroup.getGroup();		
			});			
		},

				
		/*
		 * Inserts a GroupListView for the given UserGroup collection
		 */
		createGroupList: function(userGroup, options){			
			//Only create a list for new groups that aren't yet on the page
			var existingGroupLists = _.where(this.subviews, {type: "GroupListView"});
			if(existingGroupLists)
				var groupIds = _.pluck(existingGroupLists, "groupId");
			if(groupIds && (_.contains(groupIds, userGroup.groupId)))
				return;
			
			//Create a list of the view options
			if(typeof options == "object")
				options.collection = userGroup;
			else
				var options = { collection: userGroup };
			
			//Create the view and save it as a subview
			var groupView = new GroupListView(options);
			this.subviews.push(groupView);
			
			//Collapse the views if need be
			if((this.model.get("isMemberOf") && (this.model.get("isMemberOf").length > 3)) || (userGroup.length > 3))
				groupView.collapseMemberList();
			
			//Finally, render it and return
			return groupView.render().el;
		},
		
		/*
		 * Will send a request for info about this user and their groups, and redraw the group lists
		 * Will reset the Create New group form, too
		 */
		refreshGroupLists: function(){
			this.insertCreateGroupForm();
			this.model.getInfo();
		},
		
		/*
		 * Inserts a new form for this user to create a new group. 
		 * The form container is grabbed from the user settings template
		 */
		insertCreateGroupForm: function(){
			//Reset the form
			$("#add-group-form-container").find("input[type='text']").val("").removeClass("has-error");
			$("#group-name-notification-container").empty().removeClass("notification success error");
			
			//Create a pending group that is stored locally until the user submits it
			this.pendingGroup = new UserGroup([this.model], { pending: true });
			var groupView = new GroupListView({ collection: this.pendingGroup });
			groupView.setElement(this.$("#add-group-container .member-list"));
			groupView.render();	
		},
		
		/*
		 * Gets the group name the user has entered and attempts to get this group from the server
		 * If no group is found, then the group name is marked as available. Otherwise an error msg is displayed
		 */
		checkGroupName: function(e){
			if(!e || !e.target) return;
			
			var view = this,
				$notification = $("#group-name-notification-container"),
				$input = $(e.target);
			
			//Get the name typed in by the user
			var name = $input.val().trim();
			if(!name) return;
			
			this.listenToOnce(this.pendingGroup, "nameChecked", function(collection){
				//If the group name/id is available, then display so 
				if(collection.nameAvailable){
					var icon = $(document.createElement("i")).addClass("icon icon-ok"),
						message = "The name " + collection.name + " is available",
						container = $(document.createElement("div")).addClass("notification success");
					
					$notification.html($(container).append(icon, message));
					$input.removeClass("has-error");
				}
				else{
					var icon = $(document.createElement("i")).addClass("icon icon-remove"),
						message = "The name " + collection.name + " is already taken",
						container = $(document.createElement("div")).addClass("notification error");
				
					$notification.html($(container).append(icon, message));					
					$input.addClass("has-error");
				}
					
			});
			
			this.pendingGroup.checkName(name);
		},
		
		/*
		 * Syncs the pending group with the server
		 */
		createGroup: function(e){
			e.preventDefault();
			
			//If there is no name specified, give warning
			if(!this.pendingGroup.name){
				var $notification = $("#group-name-notification-container"),
					$input = $("#add-group-name");
				
				var icon = $(document.createElement("i")).addClass("icon icon-exclamation"),
				    message = "You must enter a group name",
				    container = $(document.createElement("div")).addClass("notification error");
			
				$notification.html($(container).append(icon, message));					
				$input.addClass("has-error");
				
				return;
			}
			//If this name is not available, exit
			else if(this.pendingGroup.nameAvailable == false) return;
			
			var view = this,
				group = this.pendingGroup;
			var success = function(data){
				view.showAlert("Success! Your group has been saved. View it <a href='#profile/" + group.groupId + "'>here</a>", "alert-success", "#add-group-alert-container");
				view.refreshGroupLists();
			}
			var error = function(xhr){
				var response = xhr? $.parseHTML(xhr.responseText) : null,
					description = "";
				if(response && response.length)
					description = $(response).find("description").text();
				
				if(description) description = "(" + description + ").";
				else description = "";
					
				view.showAlert("Your group could not be created. " + description + " Please try again.", "alert-error", "#add-group-alert-container")
			}
			
			//Create it!
			if(!this.pendingGroup.save(success, error)) 
				error();
		},
		
		//------------------------------------------------ Identities/Accounts -------------------------------------------------------//
		/*
		 * Sends a new identity map request and displays notifications about the result 
		 */
		sendMapRequest: function(e) {
			e.preventDefault();
			
			//Get the identity entered into the input
			var equivalentIdentity = this.$("#map-request-field").val();
			if (!equivalentIdentity || equivalentIdentity.length < 1) {
				return;
			}
			//Clear the text input
			this.$("#map-request-field").val("");
			 	
			//Show notifications after the identity map request is a success or failure 
			var viewRef = this,
				success = function(){
					var message = "A username map request has been sent to <a href='#profile/" + equivalentIdentity + "'>" + equivalentIdentity + "</a>"
					  "<h4>Next step:</h4><p>Login with this other account and approve this request.</p>"
					viewRef.showAlert(message, null, "#request-alert-container");
				},
				error = function(xhr){
					viewRef.showAlert(xhr.responseText, 'alert-error', "#request-alert-container");
				};
			
			//Send it
			this.model.addMap(equivalentIdentity, success, error);
		},
		
		/*
		 * Removes a confirmed identity map request and displays notifications about the result 
		 */
		removeMap: function(e) {
			e.preventDefault();
			
			var equivalentIdentity = $(e.target).parents("a").attr("data-identity");	
			if(!equivalentIdentity) return;
			
			var viewRef = this,
				success = function(){
					viewRef.showAlert("Success! Your account is no longer associated with the user " + equivalentIdentity, "alert-success", "#identity-alert-container");
				},
				error = function(xhr, textStatus, error){
					viewRef.showAlert("Something went wrong: " + xhr.responseText, 'alert-error', "#identity-alert-container");
				};

			this.model.removeMap(equivalentIdentity, success, error);
		},
		
		/*
		 * Confirms an identity map request that was initiated from another user, and displays notifications about the result 
		 */
		confirmMapRequest: function(e) {			
			var model = this.model;

			e.preventDefault();
			var otherUsername = $(e.target).parents("a").attr("data-identity");	
				
			var viewRef = this;
			
			var success = function(data, textStatus, xhr) {
				viewRef.showAlert("Success! Your account is now linked with the username " + otherUsername, "alert-success", "#pending-alert-container");
			}
			var error = function(xhr, textStatus, error) {
				viewRef.showAlert(xhr.responseText, 'alert-error', "#pending-alert-container");
			}
			
			//Confirm this map request
			this.model.confirmMapRequest(otherUsername, success, error);		
		},
		
		/*
		 * Rejects an identity map request that was initiated by another user, and displays notifications about the result 
		 */
		rejectMapRequest: function(e) {			
			e.preventDefault();
			
			var equivalentIdentity = $(e.target).parents("a").attr("data-identity");
			
			if(!equivalentIdentity) return;
						
			var viewRef = this,
				success = function(data){
					viewRef.showAlert("Removed mapping request for " + equivalentIdentity, "alert-success", "#pending-alert-container");
				},
				error = function(xhr, textStatus, error){
					viewRef.showAlert(xhr.responseText, 'alert-error', "#pending-alert-container");
				};
			
			this.model.denyMapRequest(equivalentIdentity, success, error);
		},
		
		insertIdentityList: function(){
			var identities = this.model.get("identities");
			
			//Remove the equivalentIdentities list if it was drawn already so we don't do it twice
			this.$("#identity-list-container").empty();
			
			//Create the list element
			if(identities.length < 1){
				var identityList = $(document.createElement("p")).text("Your account is not mapped to any other accounts. Send a request below.");
			}
			else
				var identityList = $(document.createElement("ul")).addClass("list-identity").attr("id", "identity-list");
			
			var view = this;
			//Create a list item for each identity
			_.each(identities, function(identity, i){
				var listItem = view.createUserListItem(identity, { confirmed: true });
				
				//When/if the info from the equivalent identities is retrieved, update the item
				view.listenToOnce(identity, "change:fullName", function(identity){
					var newListItem = view.createUserListItem(identity, {confirmed: true});
					listItem.replaceWith(newListItem);
				});
				
				$(identityList).append(listItem);				
			});
			
			//Add to the page
			//$(identityList).find(".collapsed").hide();
			this.$("#identity-list-container").append(identityList);
		},
		
		insertPendingList: function(){
			var pending = this.model.get("pending");
			
			//Remove the equivalentIdentities list if it was drawn already so we don't do it twice
			this.$("#pending-list-container").empty();
	
			//Create the list element
			if (pending.length < 1){
				this.$("[data-subsection='pending-accounts']").hide();
				return;
			}
			else{
				this.$("[data-subsection='pending-accounts']").show();
				this.$("#pending-list-container").prepend($(document.createElement("p")).text("You have " + pending.length + " new request to map accounts. If these requests are from you, accept them below. If you do not recognize a username, reject the request."));
				var pendingList = $(document.createElement("ul")).addClass("list-identity").attr("id", "pending-list");
				var pendingCount = $(document.createElement("span")).addClass("badge").attr("id", "pending-count").text(pending.length);
				this.$("#pending-list-heading").append(pendingCount);
			}
			
			//Create a list item for each pending id
			var view = this;
			_.each(pending, function(pendingUser, i){					
				var listItem = view.createUserListItem(pendingUser, {pending: true});
				$(pendingList).append(listItem);
				
				if(pendingUser.isOrcid()){
					view.listenToOnce(pendingUser, "change:fullName", function(pendingUser){
						var newListItem = view.createUserListItem(pendingUser, {pending: true});
						listItem.replaceWith(newListItem);
					});
				}
			});
			
			//Add to the page
			this.$("#pending-list-container").append(pendingList);
		},
		
		createUserListItem: function(user, options){
			var pending = false,
				confirmed = false;
			
			if(options && options.pending)
				pending = true;
			if(options && options.confirmed)
				confirmed = true;
			
			var username = user.get("username"),
			    fullName = user.get("fullName") || username;
		
			var listItem = $(document.createElement("li")).addClass("list-group-item identity"),
				link     = $(document.createElement("a")).attr("href", "#profile/" + username).attr("data-identity", username).text(fullName),
				details  = $(document.createElement("span")).addClass("subtle details").text(username);

			listItem.append(link, details);

			if(pending){
				var acceptIcon = $(document.createElement("i")).addClass("icon icon-ok icon-large icon-positive tooltip-this").attr("data-title", "Accept Request").attr("data-trigger", "hover").attr("data-placement", "top"),
					rejectIcon = $(document.createElement("i")).addClass("icon icon-remove icon-large icon-negative tooltip-this").attr("data-title", "Reject Request").attr("data-trigger", "hover").attr("data-placement", "top"),
					confirm = $(document.createElement("a")).attr("href", "#").addClass('confirm-request-btn').attr("data-identity", username).append(acceptIcon),
					reject = $(document.createElement("a")).attr("href", "#").addClass("reject-request-btn").attr("data-identity", username).append(rejectIcon);
				
				listItem.prepend(confirm, reject).addClass("pending");
			}
			else if(confirmed){
				var removeIcon = $(document.createElement("i")).addClass("icon icon-remove icon-large icon-negative"),
					remove = $(document.createElement("a")).attr("href", "#").addClass("remove-identity-btn").attr("data-identity", username).append(removeIcon);
				$(remove).tooltip({
					trigger: "hover",
					placement: "top",
					title: "Remove equivalent account"
				});
				listItem.prepend(remove.append(removeIcon));
			}

			if(user.isOrcid()){			
				details.prepend(this.createIdPrefix(), " ORCID: ");
			}
			else
				details.prepend(" Username: ");
			
			return listItem;
		},
		
		updateModForm: function() {
			this.$("#mod-givenName").val(this.model.get("firstName"));
			this.$("#mod-familyName").val(this.model.get("lastName"));
			this.$("#mod-email").val(this.model.get("email"));
			
			if (this.model.get("registered")) {
				this.$("#registered-user-container").show();
			} else {
				this.$("#registered-user-container").hide();
			}
		},
		
		/*
		 * Gets the user account settings, updates the UserModel and saves this new info to the server
		 */
		saveUser: function(e) {
			
			e.preventDefault();
			
			var view = this,
				container = this.$('[data-subsection="edit-account"] .content') || $(e.target).parent();
			
			var success = function(data){
				$(container).find(".loading").detach();
				$(container).children().show();
				view.showAlert("Success! Your profile has been updated.", 'alert-success', container);
			}
			var error = function(data){
				$(container).find(".loading").detach();
				$(container).children().show();
				var msg = (data && data.responseText) ? data.responseText : "Sorry, updating your profile failed. Please try again.";
				if(!data.responseText)
					view.showAlert(msg, 'alert-error', container);
			}

			//Get info entered into form
			var givenName = this.$("#mod-givenName").val();
			var familyName = this.$("#mod-familyName").val();
			var email = this.$("#mod-email").val();
			
			//Update the model
			this.model.set("firstName", givenName);
			this.model.set("lastName", familyName);
			this.model.set("email", email);
			
			//Loading icon
			$(container).children().hide();
			$(container).prepend(this.loadingTemplate());
			
			//Send the update
			this.model.update(success, error);
			
		},
		
		//---------------------------------- Token -----------------------------------------//
		getToken: function(){		
			var model = this.model;
			
			//Show loading sign
			this.$("#token-generator-container").html(this.loadingTemplate());
			
			//When the token is retrieved, then show it
			this.listenToOnce(this.model, "change:token", this.showToken);
			
			//Get the token from the CN
			this.model.checkToken(function(data, textStatus, xhr){				
				model.getTokenExpiration();
				model.set("token", data);				
				model.trigger("change:token");
			});			
		},
		
		showToken: function(){
			var token = this.model.get("token");
			
			if(!token)				
				return;
			
			var expires    = this.model.get("expires"),
				tokenInput = $(document.createElement("textarea")).attr("type", "text").attr("rows", "5").addClass("token copy").text(token),
				copyButton = $(document.createElement("a")).addClass("btn btn-primary copy").text("Copy").attr("data-clipboard-text", token),
				successIcon = $(document.createElement("i")).addClass("icon icon-ok"),
		  		copySuccess = $(document.createElement("div")).addClass("notification success copy-success hidden").append(successIcon, " Copied!"),
		  		expirationMsg = "<strong>Note:</strong> Your identification code expires on " + expires.toLocaleDateString() + " at " + expires.toLocaleTimeString(),
		  		usernameMsg = "<div class='footnote'>Your user identity: ",
		  		usernamePrefix = this.createIdPrefix();
			
			if(typeof usernamePrefix == "object")
				usernameMsg += usernamePrefix[0].outerHTML;
			else if(typeof usernamePrefix == "string")
				usernameMsg += usernamePrefix;
			
			usernameMsg += this.model.get("username") + "</div>";
						
			var	successMessage = $.parseHTML(this.alertTemplate({
					msg: 'Copy your identification code: <br/> ' + expirationMsg + usernameMsg,
					classes: "alert-success",
					containerClasses: "well"
				}));
			$(successMessage).append(tokenInput, copyButton, copySuccess);
			this.$("#token-generator-container").html(successMessage);
			
			//Create a copy button
			ZeroClipboard.config( { swfPath: "./components/zeroclipboard/ZeroClipboard.swf" } );
			var client = new ZeroClipboard(copyButton);
			client.on("aftercopy", function(e){
				copySuccess.show().delay(3000).fadeOut();
			});
		},
		
		setUpAutocomplete: function() {
			var input = this.$(".account-autocomplete");
			if(!input || !input.length) return;
						
			// look up registered identities 
			$(input).hoverAutocomplete({
				source: function (request, response) {
		            var term = $.ui.autocomplete.escapeRegex(request.term);
		            
		            var list = [];
		            
		            //Ids/Usernames that we want to ignore in the autocompelte
		            var ignoreEquivIds = ($(this.element).attr("id") == "map-request-field"),
		            	ignoreIds = ignoreEquivIds? appUserModel.get("identitiesUsernames") : [];		            	
		            ignoreIds.push(appUserModel.get("username").toLowerCase());
		            
		            var url = appModel.get("accountsUrl") + "?query=" + encodeURIComponent(term);					
					var requestSettings = {
						url: url, 
						success: function(data, textStatus, xhr) {
							_.each($(data).find("person"), function(person, i){
								var item = {};
								item.value = $(person).find("subject").text();
								
								//Don't display yourself in the autocomplete dropdown (prevents users from adding themselves as an equivalent identity or group member)
								//Also don't display your equivalent identities in the autocomplete
								if(_.contains(ignoreIds, item.value.toLowerCase())) return;								
									
								item.label = $(person).find("fullName").text() || ($(person).find("givenName").text() + " " + $(person).find("familyName").text());
								list.push(item);
							});
							
				            response(list);
	
						}
					}
					$.ajax(_.extend(requestSettings, appUserModel.createAjaxSettings()));			
					
					//Send an ORCiD search when the search string gets long enough
					if(request.term.length > 3)
						appLookupModel.orcidSearch(request, response, false, ignoreIds);       
		        },
				select: function(e, ui) {
					e.preventDefault();
					
					// set the text field
					$(e.target).val(ui.item.value);
					$(e.target).parents("form").find("input[name='fullName']").val(ui.item.label);
				},
				position: {
					my: "left top",
					at: "left bottom",
					collision: "none"
				}
			});
			
		},
		
		//---------------------------------- Misc. and Utilities -----------------------------------------//

		showAlert: function(msg, classes, container) {
			if(!classes)
				var classes = 'alert-success';
			if(!container || !$(container).length)
				var container = this.$el;

			//Remove any alerts that are already in this container
			if($(container).children(".alert-container").length > 0)
				$(container).children(".alert-container").remove();
			
			$(container).prepend(
					this.alertTemplate({
						msg: msg,
						classes: classes
					})
			);
		},
		
		preventSubmit: function(e){
			if(e.keyCode != 13) return;
			
			e.preventDefault();
		},
		
		onClose: function () {			
			//Clear the template
			this.$el.html("");
			
			//Reset the active section and subsection
			this.activeSection = "profile";
			this.activeSubSection = "";
			
			//Remove saved elements
			this.$profile = null;
			
			//Stop listening to changes in models
			this.stopListening(statsModel);		
			this.stopListening(this.model);
			this.stopListening(appUserModel);
			
			//Close the subviews
			_.each(this.subviews, function(view){
				view.onClose();
			});
			this.subviews = new Array();
		}
		
	});
	
	return UserView;		
});
