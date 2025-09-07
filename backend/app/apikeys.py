from pickledb import PickleDB

class KeyManager:
    def __init__(self, keyfile: str):
        self.db = PickleDB(keyfile)
    
    def verify(self, key: str):
        return key in self.db