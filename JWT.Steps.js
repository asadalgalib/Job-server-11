/**
 * 1. after successful login : generate a jwt token
 *  npm i jsonwebtoken , cookie-parser
 *  jwt.sign(payload, secret, {expiresIn : 'id'})
 * 
 * 2. send token to the client side 
 * 
 *  localstorage (easier)
 * 
 *  httpOnly (better)
 * 
 * 3. for sensetive or secure apis : send token to the server side
 * 
 *  app.use(cors({
     origin : ['http://localhost:5173'],
     credentials: true
    }));

    in client side use axios  and must use withCredentials : true
 * 
 * 4. validate the token in the server side :
 *  if valid : provide the data
 *  else : logout
 * 
 */