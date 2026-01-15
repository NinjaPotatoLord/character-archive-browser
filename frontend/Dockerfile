FROM nginx:alpine

COPY index.html /usr/share/nginx/html/
RUN mkdir -p /usr/share/nginx/html/js
RUN mkdir -p /usr/share/nginx/html/css
COPY js/ /usr/share/nginx/html/js/
COPY css/ /usr/share/nginx/html/css/
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
