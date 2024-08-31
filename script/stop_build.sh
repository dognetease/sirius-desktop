ps -ef | grep `pwd` | awk '{print $2}' | xargs -I {} kill -9 {}

