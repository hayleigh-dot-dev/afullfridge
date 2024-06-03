import gleam/io
import gleam/list
import gleam/option.{type Option, None, Some}
import gleam/result
import gleam/uri
import lustre
import lustre/attribute
import lustre/effect
import lustre/element
import lustre/element/html
import lustre/event
import lustre_http
import lustre_websocket as ws
import modem
import shared

pub type Model {
  Model(uri: uri.Uri, route: Route, room_code_input: String)
  InRoom(
    ws: Option(ws.WebSocket),
    player_id: shared.PlayerId,
    room: shared.Room,
    player_name: String,
    round: Option(shared.Round),
  )
}

pub type Route {
  Home
  Play(room_code: Option(String))
  NotFound
}

pub type Msg {
  OnRouteChange(uri.Uri, Route)

  WebSocketEvent(ws.WebSocketEvent)
  OnWebsocketMessage(shared.WebsocketResponse)

  StartGame
  JoinGame
  JoinedRoom(Result(shared.HttpResponse, lustre_http.HttpError))

  UpdateRoomCode(String)
  UpdatePlayerName(String)
  SetPlayerName
}

pub fn main() {
  let app = lustre.application(init, update, view)
  let assert Ok(_) = lustre.start(app, "#app", Nil)

  Nil
}

fn new_uri() -> uri.Uri {
  uri.Uri(
    scheme: None,
    userinfo: None,
    host: None,
    port: None,
    path: "",
    query: None,
    fragment: None,
  )
}

fn relative(path: String) -> uri.Uri {
  uri.Uri(..new_uri(), path: path)
}

fn init(_flags) -> #(Model, effect.Effect(Msg)) {
  let uri = modem.initial_uri()
  case uri, uri |> result.map(get_route_from_uri) {
    Ok(uri), Ok(Play(Some(room_code))) -> #(
      Model(uri, Play(Some(room_code)), room_code),
      effect.batch([join_game(room_code), modem.init(on_url_change)]),
    )
    Ok(uri), Ok(route) -> #(Model(uri, route, ""), modem.init(on_url_change))
    Error(Nil), _ | _, Error(Nil) -> #(
      Model(relative(""), Home, ""),
      modem.init(on_url_change),
    )
  }
}

pub fn update(model: Model, msg: Msg) -> #(Model, effect.Effect(Msg)) {
  case model, msg {
    Model(_, _, _), StartGame -> #(model, start_game())
    Model(uri, _, _), JoinedRoom(Ok(shared.RoomResponse(room, player_id))) -> {
      #(
        InRoom(
          None,
          player_id: player_id,
          room: room,
          player_name: "",
          round: None,
        ),
        modem.push(
          uri.Uri(
            ..relative("/play"),
            query: Some(uri.query_to_string([#("game", room.room_code)])),
          ),
        ),
      )
    }
    Model(_, _, _), JoinedRoom(Error(err)) -> {
      io.debug(err)
      #(model, effect.none())
    }
    Model(_, _route, room_code_input), OnRouteChange(uri, route) -> #(
      Model(uri, route, room_code_input),
      effect.none(),
    )
    Model(uri, route, _room_code_input), UpdateRoomCode(room_code) -> #(
      Model(uri, route, room_code),
      effect.none(),
    )
    Model(_, _, room_code_input), JoinGame -> #(
      model,
      join_game(room_code_input),
    )
    Model(_, _, _), UpdatePlayerName(_) -> #(model, effect.none())
    Model(_, _, _), _ -> #(model, effect.none())
    InRoom(ws, player_id, room, _player_name, round),
      UpdatePlayerName(player_name)
    -> #(InRoom(ws, player_id, room, player_name, round), effect.none())
    InRoom(_ws, player_id, _room, player_name, _round), SetPlayerName -> #(
      model,
      ws.init(
        "ws://localhost:3000/ws/" <> player_id <> "/" <> player_name,
        WebSocketEvent,
      ),
    )
    InRoom(_ws, player_id, room, player_name, round), WebSocketEvent(ws_event) -> {
      case ws_event {
        ws.InvalidUrl -> panic
        ws.OnOpen(socket) -> #(
          InRoom(Some(socket), player_id, room, player_name, round),
          effect.none(),
        )
        ws.OnTextMessage(msg) -> handle_ws_message(model, msg)
        ws.OnBinaryMessage(_msg) -> #(model, effect.none())
        ws.OnClose(_reason) -> #(
          InRoom(None, player_id, room, player_name, round),
          effect.none(),
        )
      }
    }
    InRoom(_ws, _player_id, _room, _player_name, _round), _ -> #(
      model,
      effect.none(),
    )
  }
}

fn handle_ws_message(model: Model, msg: String) -> #(Model, effect.Effect(Msg)) {
  case model {
    Model(_, _, _) -> #(model, effect.none())
    InRoom(ws, player_id, room, player_name, round) ->
      case shared.decode_websocket_response(msg) {
        Ok(shared.PlayersInRoom(player_list)) -> #(
          InRoom(
            ws,
            player_id,
            room: shared.Room(..room, players: player_list),
            player_name: player_name,
            round: round,
          ),
          effect.none(),
        )
        Ok(shared.WordList(word_list)) -> #(
          InRoom(
            ws,
            player_id,
            room: shared.Room(..room, word_list: word_list),
            player_name: player_name,
            round: round,
          ),
          effect.none(),
        )
        Ok(shared.RoundInfo(round)) -> #(
          InRoom(ws, player_id, room, player_name, Some(round)),
          effect.none(),
        )
        Ok(shared.ServerError(reason)) | Error(reason) -> {
          io.debug(reason)
          #(model, effect.none())
        }
      }
  }
}

fn start_game() {
  lustre_http.get(
    "http://localhost:3000/createroom",
    lustre_http.expect_json(shared.decode_http_response_json, JoinedRoom),
  )
}

fn join_game(room_code) {
  lustre_http.post(
    "http://localhost:3000/joinroom",
    shared.encode_http_request(shared.JoinRoomRequest(room_code)),
    lustre_http.expect_json(shared.decode_http_response_json, JoinedRoom),
  )
}

fn get_route_from_uri(uri: uri.Uri) -> Route {
  let room_code =
    uri.query
    |> option.map(uri.parse_query)
    |> option.then(fn(query) {
      case query {
        Ok([#("game", room_code)]) -> Some(room_code)
        _ -> None
      }
    })
  case uri.path_segments(uri.path), room_code {
    [""], _ | [], _ -> Home
    ["play"], room_code -> Play(room_code)
    _, _ -> NotFound
  }
}

fn on_url_change(uri: uri.Uri) -> Msg {
  get_route_from_uri(uri) |> OnRouteChange(uri, _)
}

pub fn view(model: Model) -> element.Element(Msg) {
  let content = content(model)

  html.div([], [header(model), content])
}

fn link(href, content) {
  html.a(
    [
      attribute.class("p-2 underline border-solid rounded m-2"),
      attribute.href(href),
    ],
    content,
  )
}

fn header(model: Model) {
  case model {
    Model(_, Home, _) ->
      html.h1([attribute.class("text-4xl my-10 text-center")], [
        element.text("A Full Fridge"),
      ])
    // CreateRoom ->
    //   html.div([], [
    //     html.nav([attribute.class("flex items-center")], [
    //       link("/", [element.text("Home")]),
    //       html.h1([attribute.class("text-2xl my-5")], [
    //         element.text("Start new game"),
    //       ]),
    //     ]),
    //   ])
    Model(_, Play(Some(_)), _) ->
      html.div([], [
        html.nav([attribute.class("flex items-center")], [
          link("/", [element.text("Home")]),
        ]),
        html.h1([attribute.class("text-2xl my-5")], [
          element.text("Joining game..."),
        ]),
      ])
    Model(_, Play(None), _) ->
      html.div([], [
        html.nav([attribute.class("flex items-center")], [
          link("/", [element.text("Home")]),
        ]),
        html.h1([attribute.class("text-2xl my-5")], [element.text("Join game")]),
      ])
    InRoom(_, _, room, _, _) ->
      html.div([], [
        html.nav([attribute.class("flex items-center")], [
          // link("/", [element.text("Leave game")]),
        ]),
        html.h1([attribute.class("text-2xl my-5")], [
          element.text("Game: " <> room.room_code),
        ]),
      ])
    Model(_, NotFound, _) ->
      html.div([], [
        html.nav([attribute.class("flex items-center")], [
          link("/", [element.text("Home")]),
        ]),
        html.h1([attribute.class("text-2xl my-5")], [
          element.text("Page not found"),
        ]),
      ])
  }
}

fn content(model: Model) {
  case model {
    Model(_, Home, _) ->
      html.div([], [
        html.p([attribute.class("mx-4 text-lg")], [
          element.text("Welcome to "),
          html.span([], [element.text("A Full Fridge")]),
          element.text(", a game about preferences best played with friends."),
        ]),
        html.button([event.on_click(StartGame)], [
          element.text("Start new game"),
        ]),
        // link("/create", [element.text("Start new game")]),
        link("/play", [element.text("Join a game")]),
      ])
    // CreateRoom ->
    //   html.div([attribute.class("flex flex-col m-4")], [
    //     html.label([attribute.for("name-input")], [element.text("Name:")]),
    //     html.input([
    //       attribute.id("name-input"),
    //       attribute.placeholder("Enter name..."),
    //       attribute.type_("text"),
    //       attribute.class(
    //         "my-2 p-2 border-2 rounded placeholder:text-slate-300",
    //       ),
    //     ]),
    //   ])
    Model(_, Play(Some(room_code)), _) ->
      element.text("Joining room " <> room_code <> "...")
    Model(_, Play(None), room_code_input) ->
      html.form(
        [event.on_submit(JoinGame), attribute.class("flex flex-col m-4")],
        [
          html.label([attribute.for("room-code-input")], [
            element.text("Enter game code:"),
          ]),
          html.input([
            attribute.id("room-code-input"),
            attribute.placeholder("glittering-intelligent-iguana"),
            attribute.type_("text"),
            attribute.class(
              "my-2 p-2 border-2 rounded placeholder:text-slate-300 placeholder:tracking-widest font-mono",
            ),
            event.on_input(UpdateRoomCode),
            attribute.value(room_code_input),
          ]),
          html.button([attribute.type_("submit")], [element.text("Join")]),
        ],
      )
    InRoom(Some(_), player_id, room, _player_name, _round) ->
      html.div([attribute.class("flex flex-col m-4")], [
        html.div([], [
          html.h2([], [element.text("Players:")]),
          html.ul(
            [],
            list.map(room.players, fn(player) {
              let display =
                case player.name, player.id {
                  "", id if id == player_id -> id <> " (you)"
                  name, id if id == player_id -> name <> " (you)"
                  "", id -> id
                  name, _ -> name
                }
                |> element.text
              html.li([], [display])
            }),
          ),
        ]),
      ])
    InRoom(None, _player_id, _room, player_name, _round) ->
      html.div([attribute.class("flex flex-col m-4")], [
        html.form(
          [event.on_submit(SetPlayerName), attribute.class("flex flex-col m-4")],
          [
            html.label([attribute.for("name-input")], [element.text("Name:")]),
            html.input([
              attribute.id("name-input"),
              attribute.placeholder("Enter name..."),
              event.on_input(UpdatePlayerName),
              attribute.value(player_name),
              attribute.type_("text"),
              attribute.class(
                "my-2 p-2 border-2 rounded placeholder:text-slate-300",
              ),
            ]),
            html.button([attribute.type_("submit")], [element.text("Set name")]),
          ],
        ),
      ])
    Model(_, NotFound, _) | _ -> element.text("Page not found")
  }
}