provider "aws" {
  access_key                  = "test"
  secret_key                  = "test"
  region                      = "us-east-1"
  s3_use_path_style           = true
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true

  endpoints {
    s3  = "http://localhost:4566"
    ec2 = "http://localhost:4566"
  }
}

resource "aws_s3_bucket" "app_assets_bucket" {
  bucket = "startup-app-assets"
}

resource "aws_instance" "app_server" {
  ami           = "ami-0c55b159cbfafe1f0" # AMI fictícia
  instance_type = "t2.micro"

  tags = {
    Name = "Servidor-App-Startup"
  }
}