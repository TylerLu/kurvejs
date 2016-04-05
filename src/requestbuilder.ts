/*

RequestBuilder allows you to discover and access the Microsoft Graph using Visual Studio Code intellisense.

Just start typing at the bottom of this file and see how intellisense helps you explore the graph:
    graph.                     me, user, users
    graph.me                   event, events, message, messages, calendarView, GET, PATCH, DELETE
    graph.me.event             event(eventId:string) => Event
    graph.me.event("123")      attachment, attachments, GET, PATCH, DELETE

Each endpoint exposes the set of available REST verbs through strongly typed methods:
    graph.me.GET():UserDataModel
    graph.me.events.GETCOLLECTION():EventDataModel
    graph.me.events.POST(event:EventDataModel):EventDataModel

Certain endpoints have parameters that are encoded into the request either in the path or the querystring:
    graph.me.event("123")
    -> /me/events/123
    graph.me.calendarView([startDate],[endDate])
    -> /me/calendarView?startDate=[startDate]&endDate=[endDate]

You can add ODATA queries through the REST methods:
    graph.me.messages("123").GET("$select=id,subject")
    -> GET "/me/messages/123?$select=id,subject""
    graph.me.calendarView([startDate],[endDate]).GETCOLLECTION("$select=organizer")
    -> GETCOLLECTION "/me/calendarView?startDate=[startDate]&endDate=[endDate]&$select=organizer""

The API mirrors the structure of the Graph paths:
    to access:
        /users/billba@microsoft.com/messages/123-456-789/attachments
    we do:
        graph.user("billba@microsoft.com").message("1234").attachments("6789")
    compare to the old Kurve-y way of doing things:
        graph.messageAttachmentForUser("billba@microsoft.com", "12345", "6789")

In this proof-of-concept the path building works, but the REST methods are stubs, and greatly simplified ones at that.
In a real version we'd add Async versions and incorporate identity handling.

Finally this initial stab only includes a few familiar pieces of the Microsoft Graph.
However I have examined the 1.0 and Beta docs closely and I believe that this approach is extensible to the full graph.

*/

import { Promise } from "./promises";
import { Graph } from "./graph";
import { Error } from "./identity";
import { UserDataModel, AttachmentDataModel, MessageDataModel, EventDataModel, MailFolderDataModel } from './models';

export interface Collection<Model> {
    objects:Model[];
    nextLink?:any;
    //  nextLink callback will go here
}

export var queryUnion = (query1:string, query2:string) => (query1 ? query1 + (query2 ? "&" + query2 : "" ) : query2); 

export var pathWithQuery = (path:string, query1?:string, query2?:string) => {
    var query = queryUnion(query1, query2); 
    return path + (query ? "?" + query : "");
}

export abstract class Node {
    constructor(protected graph:Graph, protected path:string, protected query?:string) {
    }
    protected pathWithQuery = pathWithQuery(this.path, this.query);
}

export class AttachmentEndpoint extends Node {
    GetAttachment = this.graph.GET<AttachmentDataModel>(this.pathWithQuery);
/*    
    PATCH = this.graph.PATCH<AttachmentDataModel>(this.path, this.query);
    DELETE = this.graph.DELETE<AttachmentDataModel>(this.path, this.query);
*/
}

export class AttachmentNode extends AttachmentEndpoint {
    constructor(graph:Graph, path:string, attachmentId:string) {
        super(graph, path + "/attachments/" + attachmentId);
    }
}

var attachment = (graph:Graph, path:string) => (attachmentId:string) => new AttachmentNode(graph, path, attachmentId);

export class AttachmentsEndpoint extends Node {
    GetAttachments = this.graph.GETCOLLECTION<AttachmentDataModel>(this.pathWithQuery);
/*
    POST = this.graph.POST<AttachmentDataModel>(this.path, this.query);
*/
    addQuery = (query:string) => new AttachmentsEndpoint(this.graph, this.path, queryUnion(this.query, query));
}

export class AttachmentsNode extends AttachmentsEndpoint {
    constructor(protected graph:Graph, path:string, query?:string) {
        super(graph, path + "/attachments", query);
    }
}

var attachments = (graph:Graph, path:string) => new AttachmentsNode(graph, path);

export class MessageEndpoint extends Node {
    GetMessage = this.graph.GET<MessageDataModel>(this.pathWithQuery);
/*
    PATCH = this.graph.PATCH<MessageDataModel>(this.path, this.query);
    DELETE = this.graph.DELETE<MessageDataModel>(this.path, this.query);
*/
    addQuery = (query:string) => new MessageEndpoint(this.graph, this.path, queryUnion(this.query, query));
}

export class MessageNode extends MessageEndpoint {
    constructor(protected graph:Graph, path:string, messageId:string) {
        super(graph, path + "/messages/" + messageId);
    }
    attachment = attachment(this.graph, this.path);
    attachments = attachments(this.graph, this.path);
}

var message = (graph:Graph, path:string) => (messageId:string) => new MessageNode(graph, path, messageId);

export class Messages extends Node {
    constructor(protected graph:Graph, path:string) {
        super(graph, path + "/messages/");
    }

    GetMessages = this.graph.GETCOLLECTION<MessageDataModel>(this.pathWithQuery);
/*
    POST = this.graph.POST<MessageDataModel>(this.path, this.query);
*/
}

var messages = (graph:Graph, path:string) => new Messages(graph, path);

export class EventEndpoint extends Node {
    GetEvent = this.graph.GET<EventDataModel>(this.pathWithQuery);
/*
    PATCH = this.graph.PATCH<EventDataModel>(this.path, this.query);
    DELETE = this.graph.DELETE<EventDataModel>(this.path, this.query);
*/
    addQuery = (query:string) => new EventEndpoint(this.graph, this.path, queryUnion(this.query, query));
}

export class EventNode extends EventEndpoint {
    constructor(protected graph:Graph, path:string, eventId:string) {
        super(graph, path + "/events/");
    }
    attachment = attachment(this.graph, this.path);
    attachments = attachments(this.graph, this.path);
}

var event = (graph:Graph, path:string) => (eventId:string) => new EventNode(graph, path, eventId);

export class EventsEndpoint extends Node {
    GetEvents = this.graph.GETCOLLECTION<EventDataModel>(this.pathWithQuery);
/*
    POST = this.graph.POST<EventDataModel>(this.path, this.query);
*/
    addQuery = (query:string) => new EventsEndpoint(this.graph, this.path, queryUnion(this.query, query));
}

export class EventsNode extends EventsEndpoint {
    constructor(protected graph:Graph, path:string) {
        super(graph, path + "/events/");
    }
}

var events = (graph:Graph, path:string) => new EventsNode(graph, path);

export class CalendarViewEndpoint extends Node {
    GetCalendarView = this.graph.GETCOLLECTION<EventDataModel>(this.pathWithQuery);

    addQuery = (query:string) => new CalendarViewEndpoint(this.graph, this.path, queryUnion(this.query, query));
}

export class CalendarViewNode extends CalendarViewEndpoint {
    constructor(protected graph:Graph, path:string, startDate:Date, endDate:Date) {
        super(graph, path + "/calendarView", "startDateTime=" + startDate.toISOString() + "&endDateTime=" + endDate.toISOString());
    }

    GetCalendarView = this.graph.GETCOLLECTION<EventDataModel>(this.pathWithQuery);
}

var calendarView = (graph:Graph, path:string) => (startDate:Date, endDate:Date) => new CalendarViewNode(graph, path, startDate, endDate);

export class MailFoldersEndpoint extends Node {
    GetMailFolders = this.graph.GETCOLLECTION<MailFolderDataModel>(this.pathWithQuery);

    addQuery = (query:string) => new MailFoldersEndpoint(this.graph, this.path, queryUnion(this.query, query));
}

export class MailFoldersNode extends MailFoldersEndpoint {
    constructor(protected graph:Graph, path:string) {
        super(graph, path + "/mailFolders");
    }
}

export class UserEndpoint extends Node {
    GetUser = this.graph.GET<UserDataModel>(this.pathWithQuery); // REVIEW what about GetMe?
/*
    PATCH = this.graph.PATCH<UserDataModel>(this.path, this.query);
    DELETE = this.graph.DELETE<UserDataModel>(this.path, this.query);
*/
    addQuery = (query:string) => new UserEndpoint(this.graph, this.path, queryUnion(this.query, query));
}

export class UserNode extends UserEndpoint {
    constructor(protected graph:Graph, path:string = "", userId?:string) {
        super(graph, userId ? path + "/users/" + userId : path + "/me");
    }

    message = message(this.graph, this.path);
    messages = messages(this.graph, this.path);
    event = event(this.graph, this.path);
    events = events(this.graph, this.path);
    calendarView = calendarView(this.graph, this.path);
    mailFolders = new MailFoldersNode(this.graph, this.path)
}

export class UsersEndpoint extends Node {
    GetUsers = this.graph.GETCOLLECTION<UserDataModel>(this.pathWithQuery);
/*
    CreateUser = this.graph.POST<UserDataModel>(this.path, this.query);
*/
    addQuery = (query:string) => new UsersEndpoint(this.graph, this.path, queryUnion(this.query, query));
}

export class UsersNode extends Node {
    constructor(protected graph:Graph, path:string = "") {
        super(graph, path + "/users");
    }
}
