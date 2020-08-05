--- 
layout: post 
title: 
date: 2017-09-26 23:08:00 -0400 
categories: Linux 
---

This is my first Linux post and we are going straight for the fun stuff. See, many people will say that the first experience with programming should be C or JavaScript or HTML or something like that. I say the first thing you should try is just typical Bash scripts. Why? Because you've already learned some of it probably. 

###From the top.   

Go ahead and open up a terminal in Linux. If you don't have linux available, you can do some of this with an emulator like [The one found here](https://www.tutorialspoint.com/unix_terminal_online.php)  
You can also install something called Gitbash to give you some experience with using a linux like shell. [Here is a link for that](https://git-for-windows.github.io/)  
If you get gitbash, install it to run in Gitbash window only, and make it run Checkout as is run as is. You'll see those options as the program installs.   


Before we get into writing the actual script, let's test some commands out. You should have a prompt that looks something like   

<code>SuperSweetComputer:~ MyName$</code>    

It really could be anything depending on out it's setup. There is actually a way to fully customize your prompt. So don't worry too much with what it says, as long as it ends with a $. In a terminal $ means it's ready for you to enter something into the command line. So let's enter some junk.  

<iframe src="https://giphy.com/embed/3o6wroo3oOYgTIvjIA" width="480" height="358" frameBorder="0" class="giphy-embed" allowFullScreen></iframe>

Let's do a quick warm up to test it out. Run these commands in order. See what the terminal says back to you.    

```
Computer:~ Me$ ls  
Computer:~ Me$ touch testing.txt  
Computer:~ Me$ ls
Computer:~ Me$ mkdir Folder 
Computer:~ Me$ mv testing.txt Folder  
Computer:~ Me$ ls -l  
Computer:~ Me$ cd Folder 
Computer:Folder Me$ echo "That's my purse!" > testing.txt  
Computer:Folder Me$ cat testing.txt  
```    

Okay cool. Terminal warm ups are good for you if you're nervous about using terminal, or you're working on your typing skills. It also is a good way to slowly get used to some of the commands and the options they offer. For example, you might have learned what the <code>cat</code> command does just by doing the warm up.   

What you just did was Make a folder called Folder with a file named testing.txt with the text "That's my purse!" in it. And you did it line by line.   

But let's imagine it was something bigger, and more relevant and important. Like deploying some sort of sys admin application, or changing some networking config, or finding and stealing various hashes from someone else's computer. In any of these cases, you wouldn't want to have to type it out line by line.  

<iframe src="https://giphy.com/embed/R459x856IfF6w" width="480" height="289" frameBorder="0" class="giphy-embed" allowFullScreen></iframe>

Let's do something similar to what we just did, but let's set up a bash script for it.   

Let's start by going back to the home directory.   
```
Computer:Folder Me$ cd ~
```  
Note I used the magic squigglely. Aka the tilda, Aka the home symbol. It automatically takes you back home.   
Let's check to make sure I'm not lying.   
```
Computer:~ Me$ pwd
```  
The command pwd will tell us the current working directory. It should be your home directory. If you're using an emulator it might show something like <code>/home/cg/root/</code> or <code> c/Users/Me </code>
You can do the same go home trick by just using cd by itself. FYI.   

Okay. Let's make a directory for us to play in.     
```
Computer:~ Me$ mkdir Playing
```  
and let's get into it.   
```
Computer:~ Me$ cd Playing
```  

Okay. Now let's make the file we are going to put our script into.     
```
Computer:Playing Me$ touch FirstScript.sh
```  

There are a few ways to start putting our script into this .sh file. Let's go full professional here and use vim. If you're using the website emulator, this is the end of the line for you. If you're using Gitbash you've already got vim. If you're on a linux machine, you may not have vim yet. So let's get it. 
```
Computer:Playing Me$ apt-get install vim
```  
You may have to sudo that mess.   
 
```
Computer:Playing Me$ sudo apt-get install vim
```

Put in your password if it asks. And let it do it's thing. It will let you know when it's done.   
You've most likely got a mess on your terminal. Do dis.   
```
Computer:Playing Me$ clear
```  
Clear is a magical command. I use it between like every 2 or 3 commands. Love it.   
Right. So now vim into your script to start editing it.   
```
Computer:Playing Me$ vim FirstScript.sh 
```  

When you do this, your screen is going to change. You've essentially left the bash and went into a terminal ran program called vim. There are multiple text editors like this. Sometimes you will see people use Nano or some other junk. Vim is good. Feel free to read the arguments about which is better on twitter or redit.   
This is what it will look like.   
![Vim](/assets/img/vim1.png) 
or   
![Vim again](/assets/img/vim2.png)  
Or maybe something else. (Yes that is Mac instead of Linux. Mac uses an almost identical terminal system based off of Unix. It also has the same background and scheme as the website. Um hmm.  
   
Vim has modes in a way. As soon as it opens, you're in a mode that allows you to move around and look at the file. When you are ready to edit something press the <code> i</code> key. To get back to this mode you can hit the esc key.  
Starting at the top. press the i key to get in and let's add our first line. This line is going to be key for making this lonely little text file into a super awesome executable bash script.   
 
<code> #!/bin/bash </code>  
 
Now let's add some stuff. Try typing this stuff out for practice. Or copy it if you're a weakling.   
 
 ```bash
#This is how you write a comment. This line will be ignored when ran. It's for leaving yourself and other's notes about the program. 
#Starting Script (this is still a comment. Just so you know where the actual code starts)
echo -e "I'm a sweet script that is about to run all by itself anytime I tell it to What is your name?"
read NAME
echo "Cool name $NAME, I'm going to make a folder and a file and then put some stuff in it, I'll let you know when I'm done"
mkdir MadeThis
cd MadeThis
touch MadeThisToo.txt
echo "Look at all the junk I made" > MadeThisToo.txt
echo "Alright dudes, I'm done"
#Script is done
```
You'll notice that each line you write, is identical to how you'd write it if you were in the terminal running it line by line. Like we did earlier. When this gets executed, that is exactly how it will run it. Line by line.   
Let's save this. Press ESC to leave the editing mode. Now type <code>:wq</code> and press enter. You just told vim to save the changes and quit. or Write Quit. If you ever need to quit without writing just do <code>:q!</code>

Let's make the terminal print out what we typed to review it real quick. 
```
Computer:Playing Me$ cat FirstScript.sh
```  

Cool. Looks good. If you want to edit it just use vim again. i to edit it. make sure to :wq it.  


Now. This is a new linux command that we haven't used yet, but it is pretty important. It comes into play often if you're writing stuff like this. The file so far doesn't have the ability to just be executed. We wouldn't want these scripts just ready to run all willy nilly as soon as we write them right?  


Let's make it work.  
 
```
Computer:Playing Me$ chmod u+x FirstScript.sh 
```  

and let it do work. When it's done we are ready to execute.
```
Computer:Playing Me$ bash FirstScript.sh 
```
Yep. How awesome is that?   

Let's break down some of the lines in the  FirstScript.sh  

First off you see the   
<code> echo -e </code>  
That is where it prompts you to say something to it. Directly after you have the line of   
<code> read NAME </code>    
Where we read what the input from the user is and save it as a variable called NAME so that we can use it later. We used it in the echo later by  
<code> $NAME </code>    
Notice we used a $ before NAME to tell it to use what was saved in NAME instead of the word NAME. Basically.    
That is all there is to it. Try making a few scripts. Seriously. Like maybe something like ifconfig or traceroute or ping saved to a file. Or learn how to use if statements and make a word game or something.   

Okay bye. Thanks.   

Cheers,   
Zack 

<iframe src="https://giphy.com/embed/LRVnPYqM8DLag" width="480" height="269" frameBorder="0" class="giphy-embed" allowFullScreen></iframe>

 