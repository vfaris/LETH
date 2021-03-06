angular.module('leth.controllers')  
  .controller('FriendsCtrl', function ($scope, Friends, $ionicListDelegate,  AppService, Chat) {    
    
     $scope.$on('$ionicView.enter', function() {
      $scope.loadFriends();

      $scope.cancelDMNotifications();
      $scope.clearBadge();
      $scope.$digest(); 
    })

    $scope.edit = function (friend) {
      $scope.addAddress(friend.name, friend.comment, friend.addr,friend.idkey);
      $ionicListDelegate.closeOptionButtons();
    };

    $scope.remove = function (friendIndex) {
      Friends.remove($scope.friends,friendIndex);
      localStorage.Friends = JSON.stringify($scope.friends);
      $ionicListDelegate.closeOptionButtons();
    };

    $scope.payFriends = function () {
      $state.go('tab.wallet');
      $scope.addrTo = $scope.friend.addr;
    }

  })
  .controller('FriendCtrl', function ($scope, $stateParams, $ionicHistory, $state, $timeout, $cordovaImagePicker, $ionicActionSheet, $cordovaCamera, 
                                      Geolocation, Friends, Chat, AppService) {
    $scope.friend = Friends.get($stateParams.Friend);

    $scope.$on('$ionicView.enter', function() {
      $scope.myidentity = AppService.account();
      $scope.friendBalance = Friends.balance($scope.friend);
      $scope.cancelDMNotifications();
      Friends.clearUnread($scope.friend.addr);
      $scope.clearBadge();
      $scope.$digest(); 
    })

    $scope.$on('$ionicView.beforeEnter', function() {
        $scope.showTabs(false);
    })

    $scope.$on('$ionicView.beforeLeave', function() {
      $scope.showTabs(true);
    })


    $scope.isFromTo = function(chat){
      if($scope.friend.addr == AppService.account())
        return false; //no chat with yourself
      if((chat.message.from == $scope.friend.addr && chat.message.to.indexOf(AppService.account())!=-1 )|| (chat.message.to.indexOf($scope.friend.addr)!=-1 && chat.message.from == AppService.account())){
            return true;
      }
      return false;
    }

    $scope.sendDirectMessage = function(){
      if ($scope.text.message.length==0) {
        return;
      }
      var textMsg = $scope.text.message;
      $scope.text.message="";
      
      Chat.sendCryptedMessage(textMsg,$scope.friend.addr,$scope.friend.idkey);

      $scope.scrollTo('chatScroll','bottom');

    };

     $scope.sendPhoto = function(img){
      if (img==undefined) {
        return;
      }
      //var msg = {type: 'leth', mode: 'plain', from: AppService.account(), to: null, text: '', image: img};
      //Chat.sendMessage(msg);
      Chat.sendCryptedPhoto(img,$scope.friend.addr,$scope.friend.idkey);

      $scope.scrollTo('chatScroll','bottom');    
    };

    $scope.getPhoto = function(){
      document.addEventListener("deviceready", function () {
        var options = {
          quality: 50,
          destinationType: Camera.DestinationType.DATA_URL,
          sourceType: Camera.PictureSourceType.CAMERA,
          allowEdit: true,
          encodingType: Camera.EncodingType.JPEG,
          targetWidth: 100,
          targetHeight: 100,
          popoverOptions: CameraPopoverOptions,
          saveToPhotoAlbum: false,
          correctOrientation:true
        };

        $cordovaCamera.getPicture(options).then(function(imageData) {
          var photo = "data:image/jpeg;base64," + imageData;
          $scope.sendPhoto(photo);
          console.log('photo :' + photo);
        }, function(err) {
          // error
        });

      }, false);
    };

    $scope.getImage = function(){
      document.addEventListener("deviceready", function () {
        var optionsImg = {
          maximumImagesCount: 10,
          width: 100,
          height: 100,
          quality: 50
        };

        $cordovaImagePicker.getPictures(optionsImg)
          .then(function (results) {
            window.resolveLocalFileSystemURL(results[0], function(fileEntry){
              fileEntry.file(function(file) {
                  var reader = new FileReader();
                  reader.onloadend = function(e) {
                       $scope.sendPhoto(this.result);
                   };
                  reader.readAsDataURL(file);
               }); 

            }, function(e){
              console.log(e);
            });                        
          }, function(error) {
              console.log('error get img');
        });
      }, false);
    };

    $scope.shareItems = function(){
      var hideSheet = $ionicActionSheet.show({
        buttons: [
          { text: '<i class="icon ion-ios-camera-outline"></i> Photo...' },
          { text: '<i class="icon ion-ios-location-outline"></i> Position'  }
        ],
        destructiveText: (ionic.Platform.isAndroid()?'<i class="icon ion-android-exit assertive"></i> ':'')+'Cancel',
        titleText: 'Choose to share your...',
        destructiveButtonClicked:  function() {
          hideSheet();
        },
        buttonClicked: function(index) {
          switch(index){
            case 0:
                $scope.getImage($scope.friend.addr,$scope.friend.idkey);
                break;
            case 1:
                Geolocation.getCurrentPosition()
                    .then(function (position) {
                      var coords = {latitude: position.coords.latitude, longitude: position.coords.longitude};
                      Chat.sendPosition($scope.friend.addr,coords);
                    }, function (err) {
                        // error
                    });
                break;
          }
          hideSheet();
         $timeout(function() {
           hideSheet();
          }, 20000);
        }
      })      
    };
  })