import css from "../css/app.css";

import "phoenix_html";

import { Socket } from "phoenix";

let socket = new Socket("/socket");
socket.connect();
let channel;

const establishConnection = (x = 0, y = 0) => {
  if (channel) {
    channel.leave();
  }

  channel = socket.channel(`room:${x},${y}`);

  channel
    .join()
    .receive("ok", resp => {
      console.log("Joined successfully", resp);
    })
    .receive("error", resp => {
      console.log("Unable to join", resp);
    });

  channel.on("data_room", payload => {
    const {
      position: { x, y }
    } = payload;

    if (x == "0" && y == "0") {
      return;
    }

    const currentRoom = `${x},${y}`;
    vm.rooms = Object.assign({}, vm.rooms, {
      [currentRoom]: payload.room
    });
  });

  // Log messages from the server
  channel.on("new_msg", payload => {
    var message = payload.body;
    console.log(message);
    if (
      vm.position.x != message.position.x ||
      vm.position.y != message.position.y
    ) {
      return;
    }

    var messages = [].concat(vm.messages, message);
    vm.messages = messages;

    setTimeout(function() {
      var current = document.documentElement.scrollTop;
      var height = document.body.scrollHeight;

      if (current / height < 0.9) {
        window.scrollTo(0, height + 100);
      }

      document.querySelector("#chatbox").focus();
    }, 1100);
  });
};

establishConnection();

const randomStr = () =>
  Math.random()
    .toString(36)
    .substring(7);

const randomNearby = () => {
  const items = ["none", "small", "medium", "big"];
  const array = [];
  for (var i = 0; i < 9; i++) {
    const item = items[Math.floor(Math.random() * items.length)];
    if (i == 4) {
      array.push("current");
    } else {
      array.push(item);
    }
  }
  return array;
};

var data = {
  position: { x: "0", y: "0" },
  messages: [],
  currentRoom: "0,0",
  nearbyRooms: randomNearby(),
  rooms: {
    "0,0": {
      title: "space help desk",
      description:
        "here, at {0,0}, always ready to help - your space help desk! <3"
    }
  },
  users: {},
  username: randomStr(),
  input: null,
  crumbs: {
    room_count: 0,
    user_count: 0
  }
};

var submit = function(event) {
  var text = event.target.value;

  if (text.startsWith("/username ")) {
    var username = text.replace("/username ", "").trim();
    vm.username = username;
  } else if (text.startsWith("/claim")) {
    channel.push("claim_room", {
      body: {
        user: { name: vm.username }
      }
    });
  } else {
    if (0 < text.length && text.length < 999) {
      const position = {
        x: vm.position.x.toString(),
        y: vm.position.y.toString()
      };

      console.log(channel);
      channel.push("new_msg", {
        body: {
          position,
          posted: new Date(),
          id: randomStr,
          user: { name: vm.username },
          text: text
        }
      });
    }
  }

  vm.input = "";
};

function move(x, y) {
  vm.position.x = `${parseInt(vm.position.x) + x}`;
  vm.position.y = `${parseInt(vm.position.y) + y}`;

  const currentRoom = [vm.position.x, vm.position.y].join(",");

  establishConnection(vm.position.x, vm.position.y);

  vm.nearbyRooms = randomNearby();
  vm.currentRoom = currentRoom;
  vm.messages = [];
}

var vm = new Vue({
  el: "#app",
  data: data,
  methods: {
    move: move,
    submit: submit
  }
});

document.querySelector("#chatbox").focus();
