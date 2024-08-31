FROM electronuserland/builder:wine-mono-11.19
USER root
RUN npm install --global yarn
WORKDIR /home/root
COPY package.json /home/root
COPY packages/api/src /home/root/packages/api/src
COPY packages/api/*.json /home/root/packages/api/
COPY packages/api/*.js /home/root/packages/api/
COPY packages/web/src /home/root/packages/web/src
COPY packages/web/*.js /home/root/packages/web/
COPY packages/web/*.json /home/root/packages/web/
COPY packages/web/makeInstall /home/root/packages/web/
COPY packages/electron/src /home/root/packages/electron/src
COPY packages/electron/*.json /home/root/packages/electron/
COPY packages/electron/*.js /home/root/packages/electron/
COPY packages/support/src /home/root/packages/support/src
COPY packages/support/*.json /home/root/packages/support/
COPY packages/support/*.js /home/root/packages/support/
COPY packages/support/makeInstall /home/root/packages/support/
COPY modified_third_party   /home/root/modified_third_party
#RUN yarn install
#RUN yarn run build