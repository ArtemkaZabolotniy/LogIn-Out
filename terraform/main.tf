terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }
}

provider "azurerm" {
  features {}
}

resource "azurerm_container_group" "server" {
  name                = "server"
  location            = "polandcentral"
  resource_group_name = "Web_Basic_Deployment"
  os_type             = "Linux"
  ip_address_type     = "Public"
  dns_name_label      = "webmessenger"

  container {
    name   = "server"
    image  = "yehor542/web_messenger_server"
    cpu    = 1
    memory = 1.5

    ports {
      port     = 3000
      protocol = "TCP"
    }
  }
}