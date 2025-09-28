# N7y
import asyncio
import websockets
import json
import logging


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SpyServer")




class spy:
    def __init__(self):
        self.spy_connections = set()
        self.mirror_connections = set()
    
    async def handle_spy(self, websocket, path):
       
        self.spy_connections.add(websocket)
        logger.info("Total conn: %d", len(self.spy_connections))
        
        try:
            async for message in websocket:
                try:
                    gossip = json.loads(message)
                    logger.info("Spy : %s", gossip.get('type', 'unknown'))
                    
                    
                    await self.tell_mirrors(gossip)
                    
                except json.JSONDecodeError as e:
                    logger.error("failed to decode : %s", e)
                    
        except websockets.exceptions.ConnectionClosed:
            logger.info("conn closed")
        finally:
            self.spy_connections.discard(websocket)
            logger.info("Total spies: %d", len(self.spy_connections))
    
    async def handle_mirror(self, websocket, path):
        self.mirror_connections.add(websocket)
        logger.info("New connections Total mirrors: %d", len(self.mirror_connections))
        try:
            #  welcome msg
            welcome_msg = {
                "type": "welcome",
                "message": "Mirror connected",
                "timestamp": asyncio.get_event_loop().time()
            }
            await websocket.send(json.dumps(welcome_msg))
            
          
            await websocket.wait_closed()
            
        except websockets.exceptions.ConnectionClosed:
            logger.info("Mirror connection closed")
        finally:
            self.mirror_connections.discard(websocket)
            logger.info("disconnected. Total mirrors: %d", len(self.mirror_connections))
    async def tell_mirrors(self, gossip):
        if not self.mirror_connections:
            logger.warning("No hit")
            return
            
        message = json.dumps(gossip)
        disconnected_mirrors = []
        
        for mirror in self.mirror_connections:
            try:
                await mirror.send(message)
            except websockets.exceptions.ConnectionClosed:
                disconnected_mirrors.append(mirror)
            except Exception as e:
                logger.error("error on sending to mirror: %s", e)
                disconnected_mirrors.append(mirror)
        
        for dead_mirror in disconnected_mirrors:
            self.mirror_connections.discard(dead_mirror)



async def main():
    jobs = spy()
    spy_server = await websockets.serve(jobs.handle_spy, "localhost", 8765)
    logger.info("Spyjs on ws://localhost:8765")
    # mirror::8766  
    mirror_server = await websockets.serve(jobs.handle_mirror, "localhost", 8766)
    logger.info("mirror on ws://localhost:8766")
  
    
 
    await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())
