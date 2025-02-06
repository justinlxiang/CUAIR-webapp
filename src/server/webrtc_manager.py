from aiortc import RTCPeerConnection, RTCSessionDescription
import asyncio

class WebRTCManager:
    def __init__(self):
        self.pcs = set()
        self.video_track = None
        self.raspberry_pi_pc = None

    async def handle_offer(self, offer: dict, source: str = "client"):
        pc = RTCPeerConnection()
        self.pcs.add(pc)

        @pc.on("connectionstatechange")
        async def on_connectionstatechange():
            print(f"Connection state changed to: {pc.connectionState}")
            if pc.connectionState == "failed":
                await pc.close()
                self.pcs.discard(pc)
                if source == "raspberry_pi":
                    self.raspberry_pi_pc = None
                    self.video_track = None

        if source == "raspberry_pi":
            self.raspberry_pi_pc = pc
            @pc.on("track")
            def on_track(track):
                if track.kind == "video":
                    self.video_track = track
                    print("Received video track from Raspberry Pi")
        else:
            if self.video_track:
                pc.addTrack(self.video_track)
            else:
                raise Exception("No video source available")

        await pc.setRemoteDescription(RTCSessionDescription(sdp=offer["sdp"], type=offer["type"]))
        answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)

        return {"sdp": pc.localDescription.sdp, "type": pc.localDescription.type}

    async def close_connections(self):
        coros = [pc.close() for pc in self.pcs]
        await asyncio.gather(*coros)
        self.pcs.clear()
        self.video_track = None
        self.raspberry_pi_pc = None

    @property
    def has_video_source(self):
        return self.video_track is not None 