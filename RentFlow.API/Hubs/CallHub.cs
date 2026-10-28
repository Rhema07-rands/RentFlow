using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace RentFlow.API.Hubs
{
    [Authorize]
    public class CallHub : Hub
    {
        public override async Task OnConnectedAsync()
        {
            var userIdStr = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (Guid.TryParse(userIdStr, out Guid userId))
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, userId.ToString());
            }
            await base.OnConnectedAsync();
        }

        /// <summary>
        /// Initiator sends an offer to the target user.
        /// </summary>
        public async Task SendOffer(string targetUserId, object offer)
        {
            var callerIdStr = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(callerIdStr)) return;

            await Clients.Group(targetUserId).SendAsync("ReceiveOffer", callerIdStr, offer);
        }

        /// <summary>
        /// Receiver sends an answer back to the caller.
        /// </summary>
        public async Task SendAnswer(string callerUserId, object answer)
        {
            var responderIdStr = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(responderIdStr)) return;

            await Clients.Group(callerUserId).SendAsync("ReceiveAnswer", responderIdStr, answer);
        }

        /// <summary>
        /// Exchange ICE candidates between peers.
        /// </summary>
        public async Task SendIceCandidate(string targetUserId, object candidate)
        {
            var senderIdStr = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(senderIdStr)) return;

            await Clients.Group(targetUserId).SendAsync("ReceiveIceCandidate", senderIdStr, candidate);
        }

        /// <summary>
        /// Notify the other user that a call is incoming.
        /// </summary>
        public async Task CallUser(string targetUserId, string callerName, string callType = "audio")
        {
            var callerIdStr = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(callerIdStr)) return;

            await Clients.Group(targetUserId).SendAsync("IncomingCall", callerIdStr, callerName, callType);
        }

        /// <summary>
        /// Notify the caller that the call was accepted.
        /// </summary>
        public async Task AcceptCall(string callerUserId)
        {
            var responderIdStr = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(responderIdStr)) return;

            await Clients.Group(callerUserId).SendAsync("CallAccepted", responderIdStr);
        }

        /// <summary>
        /// Notify the other user the call was rejected or ended.
        /// </summary>
        public async Task EndCall(string targetUserId)
        {
            var callerIdStr = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(callerIdStr)) return;

            await Clients.Group(targetUserId).SendAsync("CallEnded", callerIdStr);
        }
    }
}
